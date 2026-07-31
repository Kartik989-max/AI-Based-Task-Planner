import logging
import os
from contextlib import asynccontextmanager
from datetime import date

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from pydantic import BaseModel

from guide_todoo import db
from guide_todoo.config import settings
from guide_todoo.ingest.pdf import extract_text_from_pdf
from guide_todoo.integrations.jira import JiraClient
from guide_todoo.integrations.reminders import list_incomplete_reminders
from guide_todoo.integrations.tasks_backend import complete_external
from guide_todoo.planner import generate_daily_plan, ingest_chat, ingest_pdf_text, reschedule_stale_tasks, sync_jira
from guide_todoo.review import end_of_day_summary, generate_monthly_report
from guide_todoo.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # ponytail: APScheduler only on local dev; Vercel uses cron routes
    if os.getenv("VERCEL") != "1" and (settings.push_reminders_locally or settings.use_todoist):
        start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Guide Todoo", version="0.2.0", lifespan=lifespan)


def verify_bridge(authorization: str | None = Header(default=None)) -> None:
    if not settings.bridge_secret:
        raise HTTPException(500, "BRIDGE_SECRET not configured on server")
    token = (authorization or "").removeprefix("Bearer ").strip()
    if token != settings.bridge_secret:
        raise HTTPException(401, "Invalid bridge token")


class ChatRequest(BaseModel):
    message: str


class CompleteRequest(BaseModel):
    task_id: int | None = None
    title: str | None = None


class BridgeAck(BaseModel):
    task_id: int
    reminder_id: str


@app.get("/health")
def health():
    db_ok = False
    try:
        db_ok = db.ping()
    except Exception:
        logger.exception("Database health check failed")
    return {
        "ok": db_ok,
        "database": "neon" if db_ok else "unavailable",
        "tasks_backend": settings.tasks_backend,
        "todoist_configured": settings.use_todoist,
        "llm_provider": settings.llm_provider,
        "llm_model": settings.resolved_model,
        "llm_configured": bool(settings.resolved_api_key),
        "reminders_mode": settings.reminders_mode,
        "jira_enabled": JiraClient().enabled,
    }


@app.get("/bridge/pending")
def bridge_pending(_: None = Depends(verify_bridge)):
    return {"tasks": db.list_unsynced_tasks()}


@app.post("/bridge/ack")
def bridge_ack(body: BridgeAck, _: None = Depends(verify_bridge)):
    db.set_reminder_id(body.task_id, body.reminder_id)
    return {"ok": True, "task_id": body.task_id}


@app.post("/ingest/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Upload a PDF file")
    data = await file.read()
    text = extract_text_from_pdf(data)
    if not text:
        raise HTTPException(400, "Could not extract text from PDF")
    try:
        tasks = ingest_pdf_text(text, file.filename)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc)) from exc
    return {"filename": file.filename, "tasks_created": len(tasks), "tasks": tasks}


@app.post("/ingest/chat")
def chat_tasks(body: ChatRequest):
    try:
        tasks = ingest_chat(body.message)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc)) from exc
    return {"tasks_created": len(tasks), "tasks": tasks}


@app.post("/jira/sync")
def jira_sync():
    try:
        created = sync_jira()
    except Exception as exc:
        raise HTTPException(500, f"Jira sync failed: {exc}") from exc
    if not JiraClient().enabled:
        raise HTTPException(400, "Jira not configured. Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN in .env")
    return {"synced": len(created), "tasks": created}


@app.post("/plan/reschedule")
def reschedule_tasks():
    try:
        updated = reschedule_stale_tasks()
    except RuntimeError as exc:
        raise HTTPException(500, str(exc)) from exc
    return {"rescheduled": len(updated), "tasks": updated}


@app.post("/plan/daily")
def daily_plan(plan_date: date | None = None):
    try:
        return generate_daily_plan(plan_date)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc)) from exc


@app.get("/tasks")
def list_all_tasks(status: str | None = None):
    return {"tasks": db.list_tasks(status=status)}


@app.post("/tasks/complete")
def complete_task(body: CompleteRequest):
    if body.task_id:
        task = db.get_task(body.task_id)
        if not task:
            raise HTTPException(404, "Task not found")
        db.update_task_status(body.task_id, "done")
        complete_external(task.get("reminder_id"))
        return {"completed": body.task_id}
    if body.title:
        matches = [t for t in db.list_tasks() if t["title"] == body.title and t["status"] != "done"]
        for task in matches:
            db.update_task_status(task["id"], "done")
            complete_external(task.get("reminder_id"))
        return {"completed_by_title": body.title, "rows": len(matches)}
    raise HTTPException(400, "Provide task_id or title")


@app.get("/review/daily")
def daily_review(day: date | None = None):
    try:
        return end_of_day_summary(day)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc)) from exc


@app.post("/review/monthly")
def monthly_review(year: int | None = None, month: int | None = None):
    try:
        return generate_monthly_report(year, month)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc)) from exc


@app.get("/reminders/incomplete")
def reminders_incomplete():
    if not settings.push_reminders_locally:
        raise HTTPException(400, "Reminders only available in local mode on Mac")
    return {"reminders": list_incomplete_reminders(settings.reminders_list)}


def _verify_cron(authorization: str | None = Header(default=None)) -> None:
    secret = settings.resolved_cron_secret
    if not secret:
        return
    token = (authorization or "").removeprefix("Bearer ").strip()
    if token != secret:
        raise HTTPException(401, "Invalid cron secret")


@app.get("/api/cron/morning")
def cron_morning(_: None = Depends(_verify_cron)):
    sync_jira()
    return generate_daily_plan()


@app.get("/api/cron/eod")
def cron_eod(_: None = Depends(_verify_cron)):
    return end_of_day_summary()


@app.get("/api/cron/monthly")
def cron_monthly(_: None = Depends(_verify_cron)):
    return generate_monthly_report()
