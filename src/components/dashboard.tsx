"use client";

import { useEffect, useState } from "react";
import { Calendar, RefreshCw, Sparkles, Sun } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion";
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48 lg:col-span-3" />
      </div>
    );
  }

  return (
    <Stagger className="grid gap-6 lg:grid-cols-3">
      <StaggerItem className="lg:col-span-2">
        <Glass glow className="p-6 md:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-heading">Today</h2>
              <p className="mt-1 text-sm text-muted">Morning brief, calendar slots, quick actions</p>
            </div>
            <Pill tone={health?.ok ? "ok" : "warn"}>{health?.ok ? "API online" : "API offline"}</Pill>
          </div>

          <div className="flex flex-wrap gap-3">
            <Btn loading={busy === "brief"} disabled={!!busy} onClick={() => run("brief")}>
              <Sun className="h-4 w-4" />
              Morning brief
            </Btn>
            <Btn loading={busy === "plan"} disabled={!!busy} onClick={() => run("plan")}>
              <Calendar className="h-4 w-4" />
              Daily plan
            </Btn>
            <Btn loading={busy === "sync"} disabled={!!busy} onClick={() => run("sync")}>
              <RefreshCw className="h-4 w-4" />
              Sync Todoist
            </Btn>
            <Btn loading={busy === "weekly"} disabled={!!busy} onClick={() => run("weekly")}>
              <Sparkles className="h-4 w-4" />
              Weekly review
            </Btn>
          </div>

          {busy ? <PageLoader /> : null}
          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          <div className="panel-inner mt-5 p-4">
            {brief ? (
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-muted">{brief}</pre>
            ) : (
              <p className="text-sm text-muted-2">Run morning brief or daily plan to see output here.</p>
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
      </StaggerItem>

      <div className="space-y-6">
        <StaggerItem>
          <Glass className="p-6">
            <h2 className="text-lg font-semibold text-heading">Goal progress</h2>
            <p className="mt-2 text-sm text-muted">{progress?.main_goal || "Set your goal in onboarding"}</p>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs text-muted-2">
                <span>Completion</span>
                <span>{progress?.progress_pct ?? 0}%</span>
              </div>
              <ProgressBar value={progress?.progress_pct || 0} />
            </div>
            <p className="mt-3 text-sm text-muted">
              {progress?.completed ?? 0}/{progress?.total_tasks ?? 0} tasks · LeetCode {progress?.leetcode.total ?? 0}
            </p>
          </Glass>
        </StaggerItem>

        <StaggerItem>
          <Glass className="space-y-2 p-6 text-sm text-muted">
            <h2 className="text-lg font-semibold text-heading">System</h2>
            <p>Onboarded: {health?.onboarded ? "yes" : "no"}</p>
            <p>Google Calendar: {health?.google_calendar ? "connected" : "not connected"}</p>
            <p>Todoist: {health?.todoist_configured ? "configured" : "missing token"}</p>
          </Glass>
        </StaggerItem>
      </div>

      <StaggerItem className="lg:col-span-3">
        <Glass className="p-6">
          <h2 className="text-lg font-semibold text-heading">Pending tasks</h2>
          {tasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-2">No pending tasks yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {tasks.map((task) => (
                <li key={String(task.id)} className="task-row text-sm">
                  <span className="font-medium text-heading">{String(task.title)}</span>
                  {task.due_date ? <span className="ml-2 text-muted-2">due {String(task.due_date)}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Glass>
      </StaggerItem>
    </Stagger>
  );
}
