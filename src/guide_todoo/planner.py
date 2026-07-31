from datetime import date

from guide_todoo import db
from guide_todoo.integrations.tasks_backend import push_task
from guide_todoo.integrations.jira import JiraClient
from guide_todoo.llm import (
    ParsedTask,
    build_daily_plan,
    parse_due_date,
    parse_pdf_tasks,
    parse_scheduled_time,
    parse_text_to_tasks,
)


def persist_parsed_tasks(
    parsed: list[ParsedTask],
    *,
    source: str,
    source_ref: str | None = None,
    parent_id: int | None = None,
) -> list[dict]:
    created: list[dict] = []
    for item in parsed:
        due = parse_due_date(item.due_date)
        external_id = push_task(
            item.title,
            description=item.description,
            due_date=due,
            priority=item.priority,
        )
        task_id = db.insert_task(
            item.title,
            description=item.description,
            source=source,
            source_ref=source_ref,
            parent_id=parent_id,
            priority=item.priority,
            due_date=due,
            reminder_id=external_id,
        )
        row = {
            "id": task_id,
            "title": item.title,
            "due_date": item.due_date,
            "todoist_id": external_id,
        }
        created.append(row)
        if item.subtasks:
            created.extend(
                persist_parsed_tasks(
                    item.subtasks,
                    source=source,
                    source_ref=source_ref,
                    parent_id=task_id,
                )
            )
    return created


def ingest_pdf_text(text: str, filename: str) -> list[dict]:
    parsed = parse_pdf_tasks(text)
    return persist_parsed_tasks(parsed, source="pdf", source_ref=filename)


def ingest_chat(message: str) -> list[dict]:
    parsed = parse_text_to_tasks(message, context="User described tasks in natural language.")
    return persist_parsed_tasks(parsed, source="chat")


def sync_jira() -> list[dict]:
    client = JiraClient()
    if not client.enabled:
        return []
    created: list[dict] = []
    existing = {t.get("jira_key") for t in db.list_tasks() if t.get("jira_key")}
    for issue in client.fetch_my_issues():
        key = issue["key"]
        if key in existing:
            continue
        due = parse_due_date(issue.get("due_date"))
        title = f"[{key}] {issue['title']}"
        external_id = push_task(
            title,
            description=issue.get("description", ""),
            due_date=due,
            priority=issue.get("priority", 2),
        )
        task_id = db.insert_task(
            title,
            description=issue.get("description", ""),
            source="jira",
            source_ref=key,
            priority=issue.get("priority", 2),
            due_date=due,
            reminder_id=external_id,
            jira_key=key,
        )
        created.append({"id": task_id, "jira_key": key, "title": issue["title"], "todoist_id": external_id})
    return created


def generate_daily_plan(plan_date: date | None = None) -> dict:
    plan_date = plan_date or date.today()
    pending = db.list_tasks(status="pending")
    plan = build_daily_plan(pending, plan_date)
    lines = [f"## Daily plan — {plan_date.isoformat()}", "", plan.summary, "", f"**Focus:** {plan.focus}", ""]
    by_id = {t["id"]: t for t in pending}
    for item in plan.items:
        due_dt = parse_scheduled_time(item.scheduled_time, plan_date)
        title = by_id[item.task_id]["title"] if item.task_id and item.task_id in by_id else item.title
        push_task(title, description=item.reason, due_date=plan_date, due_datetime=due_dt, priority=2)
        lines.append(f"- {item.scheduled_time or 'anytime'} — {title} ({item.reason})")
    content = "\n".join(lines)
    db.save_daily_plan(plan_date, content)
    return {"date": plan_date.isoformat(), "plan": content, "items": [i.model_dump() for i in plan.items]}
