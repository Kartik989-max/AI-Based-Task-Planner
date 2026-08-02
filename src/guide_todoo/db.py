import json
from contextlib import contextmanager
from datetime import date, datetime, timezone
from typing import Any

import psycopg
from psycopg.rows import dict_row

from guide_todoo.config import settings

_SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    source TEXT NOT NULL DEFAULT 'manual',
    source_ref TEXT,
    parent_id INTEGER REFERENCES tasks(id),
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 2,
    due_date DATE,
    reminder_id TEXT,
    jira_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS daily_plans (
    id SERIAL PRIMARY KEY,
    plan_date DATE NOT NULL UNIQUE,
    content TEXT NOT NULL,
    score DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_reports (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_tasks_status_reminder ON tasks (status, reminder_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    profile JSONB NOT NULL,
    onboarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_memories (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    kind TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user ON user_memories (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS oauth_tokens (
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scopes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, provider)
);

CREATE TABLE IF NOT EXISTS leetcode_solves (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    problem_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT,
    solved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_reports (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    week INTEGER NOT NULL,
    content TEXT NOT NULL,
    progress_pct DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (year, week)
);

CREATE INDEX IF NOT EXISTS idx_leetcode_user ON leetcode_solves (user_id, solved_at DESC);
"""

_initialized = False


def _ensure_db() -> None:
    global _initialized
    if _initialized:
        return
    with psycopg.connect(settings.database_url) as conn:
        conn.execute(_SCHEMA)
        conn.commit()
    _initialized = True


@contextmanager
def connect():
    _ensure_db()
    conn = psycopg.connect(settings.database_url, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def insert_task(
    title: str,
    *,
    description: str = "",
    source: str = "manual",
    source_ref: str | None = None,
    parent_id: int | None = None,
    priority: int = 2,
    due_date: date | None = None,
    reminder_id: str | None = None,
    jira_key: str | None = None,
) -> int:
    with connect() as conn:
        row = conn.execute(
            """
            INSERT INTO tasks (title, description, source, source_ref, parent_id,
                               priority, due_date, reminder_id, jira_key, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                title,
                description,
                source,
                source_ref,
                parent_id,
                priority,
                due_date,
                reminder_id,
                jira_key,
                _now(),
            ),
        ).fetchone()
        assert row is not None
        return int(row["id"])


def get_task(task_id: int) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = %s", (task_id,)).fetchone()
    return dict(row) if row else None


def list_tasks(
    *,
    status: str | None = None,
    due_on: date | None = None,
    source: str | None = None,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if status:
        clauses.append("status = %s")
        params.append(status)
    if due_on:
        clauses.append("due_date = %s")
        params.append(due_on)
    if source:
        clauses.append("source = %s")
        params.append(source)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with connect() as conn:
        rows = conn.execute(
            f"SELECT * FROM tasks {where} ORDER BY priority ASC, id ASC",
            params,
        ).fetchall()
    return [dict(r) for r in rows]


def update_task_status(task_id: int, status: str) -> None:
    completed = _now() if status == "done" else None
    with connect() as conn:
        conn.execute(
            "UPDATE tasks SET status = %s, completed_at = %s WHERE id = %s",
            (status, completed, task_id),
        )


def update_task_due_date(task_id: int, due_date: date | None) -> None:
    with connect() as conn:
        conn.execute(
            "UPDATE tasks SET due_date = %s WHERE id = %s",
            (due_date, task_id),
        )


def mark_done_by_title(title: str) -> int:
    with connect() as conn:
        cur = conn.execute(
            """
            UPDATE tasks SET status = 'done', completed_at = %s
            WHERE title = %s AND status != 'done'
            """,
            (_now(), title),
        )
        return cur.rowcount


def save_daily_plan(plan_date: date, content: str, score: float | None = None) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO daily_plans (plan_date, content, score, created_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (plan_date) DO UPDATE SET
                content = EXCLUDED.content,
                score = COALESCE(EXCLUDED.score, daily_plans.score)
            """,
            (plan_date, content, score, _now()),
        )


def get_daily_plan(plan_date: date) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM daily_plans WHERE plan_date = %s",
            (plan_date,),
        ).fetchone()
    return dict(row) if row else None


def save_monthly_report(year: int, month: int, content: str) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO monthly_reports (year, month, content, created_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (year, month) DO UPDATE SET
                content = EXCLUDED.content,
                created_at = EXCLUDED.created_at
            """,
            (year, month, content, _now()),
        )


def task_stats_between(start: date, end: date) -> dict[str, Any]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT status, source, COUNT(*) AS cnt
            FROM tasks
            WHERE created_at::date BETWEEN %s AND %s
            GROUP BY status, source
            """,
            (start, end),
        ).fetchall()
        completed_row = conn.execute(
            """
            SELECT COUNT(*) AS cnt FROM tasks
            WHERE status = 'done' AND completed_at::date BETWEEN %s AND %s
            """,
            (start, end),
        ).fetchone()
        total_row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM tasks WHERE created_at::date BETWEEN %s AND %s",
            (start, end),
        ).fetchone()
    completed = int(completed_row["cnt"]) if completed_row else 0
    total = int(total_row["cnt"]) if total_row else 0
    by_status: dict[str, int] = {}
    by_source: dict[str, int] = {}
    for row in rows:
        by_status[row["status"]] = by_status.get(row["status"], 0) + int(row["cnt"])
        by_source[row["source"]] = by_source.get(row["source"], 0) + int(row["cnt"])
    return {
        "total": total,
        "completed": completed,
        "by_status": by_status,
        "by_source": by_source,
        "completion_rate": round(completed / total * 100, 1) if total else 0.0,
    }


def tasks_completed_on(day: date) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT * FROM tasks
            WHERE status = 'done' AND completed_at::date = %s
            ORDER BY completed_at
            """,
            (day,),
        ).fetchall()
    return [dict(r) for r in rows]


def tasks_due_on(day: date) -> list[dict[str, Any]]:
    return list_tasks(due_on=day, status="pending")


def list_unsynced_tasks() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT * FROM tasks
            WHERE status = 'pending' AND reminder_id IS NULL
            ORDER BY priority, id
            """
        ).fetchall()
    return [dict(r) for r in rows]


def set_reminder_id(task_id: int, reminder_id: str) -> None:
    with connect() as conn:
        conn.execute(
            "UPDATE tasks SET reminder_id = %s WHERE id = %s",
            (reminder_id, task_id),
        )


def export_tasks_json() -> str:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM tasks ORDER BY id").fetchall()
    return json.dumps([dict(r) for r in rows], indent=2, default=str)


def ping() -> bool:
    with connect() as conn:
        conn.execute("SELECT 1")
    return True


def upsert_user_profile(user_id: str, profile: dict[str, Any]) -> None:
    now = _now()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO user_profiles (user_id, profile, onboarded_at, updated_at)
            VALUES (%s, %s::jsonb, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                profile = EXCLUDED.profile,
                updated_at = EXCLUDED.updated_at
            """,
            (user_id, json.dumps(profile), now, now),
        )


def get_user_profile(user_id: str) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT profile FROM user_profiles WHERE user_id = %s", (user_id,)
        ).fetchone()
    if not row:
        return None
    profile = row["profile"]
    return profile if isinstance(profile, dict) else json.loads(profile)


def add_memory(user_id: str, kind: str, content: str, source: str = "system") -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO user_memories (user_id, kind, content, source, created_at) VALUES (%s, %s, %s, %s, %s)",
            (user_id, kind, content, source, _now()),
        )


def list_memories(user_id: str, limit: int = 12) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT kind, content, source, created_at FROM user_memories
            WHERE user_id = %s ORDER BY created_at DESC LIMIT %s
            """,
            (user_id, limit),
        ).fetchall()
    return [dict(r) for r in rows]


def save_oauth_token(
    user_id: str,
    provider: str,
    access_token: str,
    refresh_token: str | None = None,
    expires_at: datetime | None = None,
    scopes: str | None = None,
) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at, scopes, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id, provider) DO UPDATE SET
                access_token = EXCLUDED.access_token,
                refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
                expires_at = EXCLUDED.expires_at,
                scopes = EXCLUDED.scopes,
                updated_at = EXCLUDED.updated_at
            """,
            (user_id, provider, access_token, refresh_token, expires_at, scopes, _now()),
        )


def get_oauth_token(user_id: str, provider: str) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM oauth_tokens WHERE user_id = %s AND provider = %s",
            (user_id, provider),
        ).fetchone()
    return dict(row) if row else None


def log_leetcode_solve(
    user_id: str,
    problem_slug: str,
    title: str,
    difficulty: str | None = None,
) -> int:
    with connect() as conn:
        row = conn.execute(
            """
            INSERT INTO leetcode_solves (user_id, problem_slug, title, difficulty, solved_at)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
            """,
            (user_id, problem_slug, title, difficulty, _now()),
        ).fetchone()
        assert row is not None
        return int(row["id"])


def leetcode_stats(user_id: str = "default") -> dict[str, Any]:
    with connect() as conn:
        total = conn.execute(
            "SELECT COUNT(*) AS cnt FROM leetcode_solves WHERE user_id = %s", (user_id,)
        ).fetchone()["cnt"]
        by_diff = conn.execute(
            """
            SELECT difficulty, COUNT(*) AS cnt FROM leetcode_solves
            WHERE user_id = %s GROUP BY difficulty
            """,
            (user_id,),
        ).fetchall()
    return {"total": int(total), "by_difficulty": {r["difficulty"] or "unknown": int(r["cnt"]) for r in by_diff}}


def save_weekly_report(year: int, week: int, content: str, progress_pct: float | None = None) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO weekly_reports (year, week, content, progress_pct, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (year, week) DO UPDATE SET content = EXCLUDED.content,
                progress_pct = EXCLUDED.progress_pct, created_at = EXCLUDED.created_at
            """,
            (year, week, content, progress_pct, _now()),
        )


def goal_progress(user_id: str = "default") -> dict[str, Any]:
    pending = list_tasks(status="pending")
    done = list_tasks(status="done")
    total = len(pending) + len(done)
    pct = round(len(done) / total * 100, 1) if total else 0.0
    profile = get_user_profile(user_id) or {}
    return {
        "main_goal": profile.get("main_goal", ""),
        "total_tasks": total,
        "completed": len(done),
        "pending": len(pending),
        "progress_pct": pct,
        "leetcode": leetcode_stats(user_id),
    }
