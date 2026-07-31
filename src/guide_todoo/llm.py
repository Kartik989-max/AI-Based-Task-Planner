from datetime import date, datetime, time
from typing import Any

from openai import OpenAI
from pydantic import BaseModel, Field

from guide_todoo.config import settings


class ParsedTask(BaseModel):
    title: str
    description: str = ""
    priority: int = Field(default=2, ge=1, le=3)
    due_date: str | None = None
    subtasks: list["ParsedTask"] = Field(default_factory=list)


ParsedTask.model_rebuild()


class DailyPlanItem(BaseModel):
    task_id: int | None = None
    title: str
    scheduled_time: str | None = None
    reason: str = ""


class DailyPlanResult(BaseModel):
    summary: str
    items: list[DailyPlanItem]
    focus: str = ""


def _client() -> OpenAI:
    return OpenAI(
        api_key=settings.resolved_api_key or "not-set",
        base_url=settings.resolved_base_url,
    )


def _chat_json(system: str, user: str) -> Any:
    if not settings.resolved_api_key:
        raise RuntimeError(
            "LLM API key missing. Set LLM_API_KEY in .env "
            "(free: Groq at console.groq.com, Gemini at aistudio.google.com, OpenRouter at openrouter.ai)."
        )
    response = _client().chat.completions.create(
        model=settings.resolved_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    import json

    return json.loads(response.choices[0].message.content or "{}")


def parse_text_to_tasks(text: str, context: str = "") -> list[ParsedTask]:
    payload = _chat_json(
        """You break work into small actionable tasks for a personal todo system.
Return JSON: {"tasks": [{"title": str, "description": str, "priority": 1-3, "due_date": "YYYY-MM-DD" or null, "subtasks": [...]}]}
Rules:
- Each task should be completable in under 2 hours.
- Break weekly/large items into daily-sized subtasks.
- priority: 1=urgent, 2=normal, 3=low
- Infer due dates from context when possible; use ISO dates only.""",
        f"Context: {context or 'general work'}\n\nContent:\n{text[:12000]}",
    )
    return [ParsedTask.model_validate(t) for t in payload.get("tasks", [])]


def parse_pdf_tasks(text: str) -> list[ParsedTask]:
    return parse_text_to_tasks(
        text,
        context="Weekly or project PDF. Drill down into small daily tasks with realistic due dates this week.",
    )


def build_daily_plan(tasks: list[dict[str, Any]], today: date | None = None) -> DailyPlanResult:
    today = today or date.today()
    task_lines = "\n".join(
        f"- id={t['id']} [{t['source']}] p{t['priority']} {t['title']} due={t.get('due_date')}"
        for t in tasks
    )
    payload = _chat_json(
        """Create a focused daily plan. Return JSON:
{"summary": str, "focus": str, "items": [{"task_id": int|null, "title": str, "scheduled_time": "HH:MM"|null, "reason": str}]}
Schedule 4-8 items max. Morning = deep work. Afternoon = meetings/admin. Respect priorities.""",
        f"Today: {today.isoformat()}\n\nPending tasks:\n{task_lines or '(none)'}",
    )
    return DailyPlanResult.model_validate(payload)


def score_day(
    completed: list[dict[str, Any]],
    planned: list[dict[str, Any]],
    plan_content: str,
) -> tuple[float, str]:
    payload = _chat_json(
        """Score productivity 0-100 for the day. Return JSON:
{"score": float, "summary": str}
Consider: completion rate, priority tasks done, plan adherence. Be encouraging but honest.""",
        f"Plan:\n{plan_content}\n\nPlanned count: {len(planned)}\nCompleted: {[t['title'] for t in completed]}",
    )
    return float(payload.get("score", 0)), str(payload.get("summary", ""))


def monthly_analysis(stats: dict[str, Any], sample_tasks: list[dict[str, Any]]) -> str:
    payload = _chat_json(
        """Write a monthly productivity analysis in markdown. Return JSON: {"report": str}
Include: completion rate, sources breakdown, wins, bottlenecks, 3 recommendations for next month.""",
        f"Stats: {stats}\n\nSample tasks: {sample_tasks[:30]}",
    )
    return str(payload.get("report", "No report generated."))


def parse_due_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def parse_scheduled_time(value: str | None, base: date | None = None) -> datetime | None:
    if not value:
        return None
    base = base or date.today()
    try:
        hour, minute = map(int, value.split(":")[:2])
        return datetime.combine(base, time(hour, minute))
    except (ValueError, TypeError):
        return None
