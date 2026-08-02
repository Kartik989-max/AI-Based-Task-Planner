"""Bidirectional Todoist sync: completions in, rollover incomplete tasks out."""

import logging
from datetime import date, datetime, time, timedelta
from typing import Any

import httpx

from guide_todoo import db
from guide_todoo.config import settings
from guide_todoo.integrations.tasks_backend import update_external_task
from guide_todoo.integrations.todoist import get_client
from guide_todoo.scheduling import workload_summary

logger = logging.getLogger(__name__)


def sync_from_todoist() -> dict[str, Any]:
    """Mark DB tasks done when completed in Todoist."""
    if not settings.use_todoist:
        return {"synced": 0, "completed": []}

    client = get_client()
    pending = [t for t in pending_tasks_with_todoist()]
    completed: list[dict[str, Any]] = []

    for task in pending:
        todoist_id = task["reminder_id"]
        try:
            remote = client.get_task(todoist_id)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                db.update_task_status(task["id"], "done")
                completed.append({"id": task["id"], "title": task["title"], "reason": "removed from Todoist"})
            continue

        if remote.get("checked") or remote.get("is_completed"):
            db.update_task_status(task["id"], "done")
            completed.append({"id": task["id"], "title": task["title"], "reason": "completed in Todoist"})

    return {"synced": len(pending), "completed": completed}


def rollover_incomplete_tasks(today: date | None = None) -> dict[str, Any]:
    """Move incomplete due/overdue tasks to future dates and update Todoist."""
    today = today or date.today()
    pending = db.list_tasks(status="pending")
    incomplete = []
    for task in pending:
        due = _parse_due(task.get("due_date"))
        if due and due <= today:
            incomplete.append(task)

    if not incomplete:
        return {"rolled": 0, "tasks": []}

    incomplete.sort(key=lambda t: (t.get("priority", 2), str(t.get("due_date"))))
    pending_all = db.list_tasks(status="pending")
    workload = workload_summary(pending_all, today + timedelta(days=1), days=30)

    rolled: list[dict[str, Any]] = []
    day_offset = 1
    count_on_day = 0
    max_per_day = settings.max_tasks_per_day

    for task in incomplete:
        while True:
            candidate = today + timedelta(days=day_offset)
            key = candidate.isoformat()
            if workload.get(key, 0) < max_per_day:
                break
            day_offset += 1
            count_on_day = 0

        new_due = today + timedelta(days=day_offset)
        db.update_task_due_date(task["id"], new_due)
        if task.get("reminder_id"):
            update_external_task(task["reminder_id"], due_date=new_due)

        workload[new_due.isoformat()] = workload.get(new_due.isoformat(), 0) + 1
        count_on_day += 1
        if count_on_day >= max_per_day:
            day_offset += 1
            count_on_day = 0

        rolled.append({
            "id": task["id"],
            "title": task["title"],
            "old_due": str(task.get("due_date")),
            "new_due": new_due.isoformat(),
        })

    return {"rolled": len(rolled), "tasks": rolled}


def run_full_sync(today: date | None = None) -> dict[str, Any]:
    """Pull Todoist completions, then rollover incomplete tasks."""
    pull = sync_from_todoist()
    roll = rollover_incomplete_tasks(today)
    return {"pull": pull, "rollover": roll}


def pending_tasks_with_todoist() -> list[dict[str, Any]]:
    return [t for t in db.list_tasks(status="pending") if t.get("reminder_id")]


def _parse_due(value: Any) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def eod_notify_at(day: date | None = None) -> datetime:
    """When EOD summary should ping Todoist (uses EOD_SUMMARY_HOUR)."""
    day = day or date.today()
    return datetime.combine(day, time(settings.eod_summary_hour, 0))
