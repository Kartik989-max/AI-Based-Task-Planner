from datetime import date, datetime

from guide_todoo.config import settings
from guide_todoo.integrations.reminders import create_reminder
from guide_todoo.integrations.todoist import get_client


def push_task(
    title: str,
    *,
    description: str = "",
    due_date: date | None = None,
    due_datetime: datetime | None = None,
    priority: int = 2,
) -> str | None:
    """Push task to configured backend. Returns external id when created."""
    if settings.use_todoist:
        return get_client().create_task(
            title,
            description=description,
            due_date=due_date,
            due_datetime=due_datetime,
            priority=priority,
        )
    if settings.push_reminders_locally:
        return create_reminder(
            title,
            list_name=settings.reminders_list,
            body=description,
            due=due_datetime,
        )
    return None


def complete_external(external_id: str | None) -> None:
    if not external_id:
        return
    if settings.use_todoist:
        get_client().close_task(external_id)
    # Apple Reminders: no close API in our thin wrapper; ponytail: skip


def notify(title: str, body: str = "") -> str | None:
    if settings.use_todoist:
        return get_client().add_comment_task(title, body)
    if settings.push_reminders_locally:
        return create_reminder(title, list_name=settings.reminders_list, body=body[:500])
    return None
