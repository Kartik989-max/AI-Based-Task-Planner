"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, RefreshCw, Sparkles, Sun } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Btn, Glass, PageLoader, Pill, ProgressBar, Skeleton } from "@/components/ui";
import { api, type Health, type Progress as GoalProgress } from "@/lib/api";

export function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [tasks, setTasks] = useState<Record<string, unknown>[]>([]);
  const [brief, setBrief] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.health(), api.progress(), api.tasks("pending")])
      .then(([h, p, t]) => {
        setHealth(h);
        setProgress(p);
        setTasks(t.tasks.slice(0, 8));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function run(action: "brief" | "plan" | "sync" | "weekly") {
    setBusy(action);
    setError(null);
    try {
      if (action === "brief") {
        const res = await api.morningBrief();
        setBrief(String(res.brief || ""));
        setSlots(res.free_slots || []);
      } else if (action === "plan") {
        const res = await api.dailyPlan();
        setBrief(String(res.plan || ""));
        setSlots(res.free_slots || []);
      } else if (action === "sync") {
        await api.syncTodoist();
        const t = await api.tasks("pending");
        setTasks(t.tasks.slice(0, 8));
      } else {
        const res = await api.weeklyReview();
        setBrief(String(res.report || ""));
      }
      setProgress(await api.progress());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="bento-asymmetric">
        <Skeleton className="bento-span-7 bento-row-2 h-80" />
        <Skeleton className="bento-span-5 h-44" />
        <Skeleton className="bento-span-5 h-44" />
        <Skeleton className="bento-span-full h-52" />
      </div>
    );
  }

  return (
    <FadeIn className="bento-asymmetric">
      <div className="bento-span-7 bento-row-2">
        <Glass glow className="h-full p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="icon-badge">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <h2 className="display-lg text-heading">Command Center</h2>
                <p className="text-body text-muted">Your daily AI briefing & actions</p>
              </div>
            </div>
            <Pill tone={health?.ok ? "ok" : "warn"}>{health?.ok ? "Live" : "Offline"}</Pill>
          </div>

          <div className="action-grid mt-6">
            <Btn loading={busy === "brief"} disabled={!!busy} onClick={() => run("brief")}>
              <Sun className="h-4 w-4" />
              Brief
            </Btn>
            <Btn loading={busy === "plan"} disabled={!!busy} onClick={() => run("plan")}>
              <Calendar className="h-4 w-4" />
              Plan
            </Btn>
            <Btn loading={busy === "sync"} disabled={!!busy} onClick={() => run("sync")}>
              <RefreshCw className="h-4 w-4" />
              Sync
            </Btn>
            <Btn loading={busy === "weekly"} disabled={!!busy} onClick={() => run("weekly")}>
              <Sparkles className="h-4 w-4" />
              Review
            </Btn>
          </div>

          {busy ? <PageLoader /> : null}
          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

          <div className="panel-inner mt-5 p-5">
            {brief ? (
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-muted">{brief}</pre>
            ) : (
              <p className="text-center text-sm text-muted-2">Hit a button above to generate your plan</p>
            )}
          </div>

          {slots.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {slots.map((s) => (
                <span key={s} className="slot-chip">
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </Glass>
      </div>

      <div className="bento-span-5">
        <Glass className="flex h-full flex-col justify-between p-6">
          <div className="icon-badge">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <p className="stat-num">{progress?.progress_pct ?? 0}%</p>
            <p className="stat-label mt-1">Goal progress</p>
          </div>
          <div className="mt-4">
            <ProgressBar value={progress?.progress_pct || 0} />
          </div>
          <p className="mt-3 truncate text-xs text-muted">{progress?.main_goal || "Set a goal in Setup"}</p>
        </Glass>
      </div>

      <div className="bento-span-5">
        <Glass className="flex h-full flex-col justify-between p-6">
          <div className="icon-badge">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-semibold text-heading">{progress?.completed ?? 0}</p>
              <p className="stat-label">Done</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-heading">{progress?.pending ?? 0}</p>
              <p className="stat-label">Pending</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            LeetCode {progress?.leetcode.total ?? 0} · {health?.onboarded ? "Onboarded" : "Needs setup"}
          </p>
        </Glass>
      </div>

      <div className="bento-span-full">
        <Glass className="p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="display-lg text-heading">Pending tasks</h2>
            <Pill>{tasks.length} active</Pill>
          </div>
          {tasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-2">No pending tasks — ingest a PDF or chat to get started</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={String(task.id)} className="task-row text-sm">
                  <span className="font-medium text-heading">{String(task.title)}</span>
                  {task.due_date ? <span className="ml-2 text-muted-2">· {String(task.due_date)}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Glass>
      </div>
    </FadeIn>
  );
}
