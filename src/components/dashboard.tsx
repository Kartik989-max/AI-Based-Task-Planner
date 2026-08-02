"use client";

import { useEffect, useState } from "react";
import { Calendar, RefreshCw, Sparkles, Sun } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Btn, Glass, Pill, ProgressBar } from "@/components/ui";
import { api, type Health, type Progress as GoalProgress } from "@/lib/api";

export function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [tasks, setTasks] = useState<Record<string, unknown>[]>([]);
  const [brief, setBrief] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.health(), api.progress(), api.tasks("pending")])
      .then(([h, p, t]) => {
        setHealth(h);
        setProgress(p);
        setTasks(t.tasks.slice(0, 8));
      })
      .catch((e: Error) => setError(e.message));
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

  return (
    <Stagger className="grid gap-6 lg:grid-cols-3">
      <StaggerItem className="lg:col-span-2">
        <Glass glow className="p-6 md:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Today</h2>
              <p className="mt-1 text-sm text-white/55">Morning brief, calendar slots, quick actions</p>
            </div>
            <Pill tone={health?.ok ? "ok" : "warn"}>{health?.ok ? "API online" : "API offline"}</Pill>
          </div>

          <div className="flex flex-wrap gap-3">
            <Btn disabled={!!busy} onClick={() => run("brief")}>
              <Sun className="h-4 w-4" />
              {busy === "brief" ? "Generating…" : "Morning brief"}
            </Btn>
            <Btn disabled={!!busy} onClick={() => run("plan")}>
              <Calendar className="h-4 w-4" />
              {busy === "plan" ? "Planning…" : "Daily plan"}
            </Btn>
            <Btn disabled={!!busy} onClick={() => run("sync")}>
              <RefreshCw className={`h-4 w-4 ${busy === "sync" ? "animate-spin" : ""}`} />
              {busy === "sync" ? "Syncing…" : "Sync Todoist"}
            </Btn>
            <Btn disabled={!!busy} onClick={() => run("weekly")}>
              <Sparkles className="h-4 w-4" />
              {busy === "weekly" ? "Reviewing…" : "Weekly review"}
            </Btn>
          </div>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

          <div className="mt-5 rounded-xl border border-white/8 bg-black/25 p-4">
            {brief ? (
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-white/80">{brief}</pre>
            ) : (
              <p className="text-sm text-white/45">Run morning brief or daily plan to see output here.</p>
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
            <h2 className="text-lg font-semibold text-white">Goal progress</h2>
            <p className="mt-2 text-sm text-white/65">{progress?.main_goal || "Set your goal in onboarding"}</p>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs text-white/50">
                <span>Completion</span>
                <span>{progress?.progress_pct ?? 0}%</span>
              </div>
              <ProgressBar value={progress?.progress_pct || 0} />
            </div>
            <p className="mt-3 text-sm text-white/55">
              {progress?.completed ?? 0}/{progress?.total_tasks ?? 0} tasks · LeetCode {progress?.leetcode.total ?? 0}
            </p>
          </Glass>
        </StaggerItem>

        <StaggerItem>
          <Glass className="space-y-2 p-6 text-sm text-white/70">
            <h2 className="text-lg font-semibold text-white">System</h2>
            <p>Onboarded: {health?.onboarded ? "yes" : "no"}</p>
            <p>Google Calendar: {health?.google_calendar ? "connected" : "not connected"}</p>
            <p>Todoist: {health?.todoist_configured ? "configured" : "missing token"}</p>
          </Glass>
        </StaggerItem>
      </div>

      <StaggerItem className="lg:col-span-3">
        <Glass className="p-6">
          <h2 className="text-lg font-semibold text-white">Pending tasks</h2>
          {tasks.length === 0 ? (
            <p className="mt-3 text-sm text-white/45">No pending tasks yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {tasks.map((task) => (
                <li key={String(task.id)} className="task-row text-sm">
                  <span className="font-medium text-white">{String(task.title)}</span>
                  {task.due_date ? <span className="ml-2 text-white/45">due {String(task.due_date)}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Glass>
      </StaggerItem>
    </Stagger>
  );
}
