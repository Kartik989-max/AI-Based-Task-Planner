from calendar import monthrange
from datetime import date

from guide_todoo import db
from guide_todoo.config import settings
from guide_todoo.config import settings
from guide_todoo.integrations.reminders import create_reminder
from guide_todoo.llm import monthly_analysis, score_day


def end_of_day_summary(day: date | None = None) -> dict:
    day = day or date.today()
    completed = db.tasks_completed_on(day)
    planned = db.tasks_due_on(day)
    plan = db.get_daily_plan(day)
    plan_content = plan["content"] if plan else "(no plan saved)"
    score, summary = score_day(completed, planned, plan_content)
    db.save_daily_plan(day, plan_content, score=score)
    report = (
        f"# Day summary — {day.isoformat()}\n\n"
        f"**Score:** {score}/100\n\n"
        f"{summary}\n\n"
        f"## Completed ({len(completed)})\n"
        + "\n".join(f"- {t['title']}" for t in completed)
        + f"\n\n## Still pending ({len(planned)})\n"
        + "\n".join(f"- {t['title']}" for t in planned)
    )
    if settings.push_reminders_locally:
        create_reminder(
            f"Day score: {score}/100",
            list_name=settings.reminders_list,
            body=summary[:500],
        )
    return {"date": day.isoformat(), "score": score, "summary": summary, "report": report}


def generate_monthly_report(year: int | None = None, month: int | None = None) -> dict:
    today = date.today()
    year = year or today.year
    month = month or today.month
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    stats = db.task_stats_between(start, end)
    sample = db.list_tasks()
    report_md = monthly_analysis(stats, sample)
    db.save_monthly_report(year, month, report_md)
    settings.reports_dir.mkdir(parents=True, exist_ok=True)
    path = settings.reports_dir / f"monthly-{year}-{month:02d}.md"
    path.write_text(report_md, encoding="utf-8")
    if settings.push_reminders_locally:
        create_reminder(
            f"Monthly report ready — {year}-{month:02d}",
            list_name=settings.reminders_list,
            body=f"Completion rate: {stats['completion_rate']}%",
        )
    return {"year": year, "month": month, "stats": stats, "report": report_md, "path": str(path)}
