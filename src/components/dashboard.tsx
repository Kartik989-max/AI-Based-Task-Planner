"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, RefreshCw, Sparkles, Sun } from "lucide-react";
import { AnimatedIcon } from "@/components/animated-icon";
import { CardAccent, EmptyIllustration } from "@/components/ambient";
import { FadeIn } from "@/components/motion";
import { Glass, PageLoader, Pill, ProgressBar, Skeleton } from "@/components/ui";
import { api, type Health, type Progress as GoalProgress } from "@/lib/api";

const actions = [
  {
    id: "brief" as const,
    icon: Sun,
    title: "Morning Brief",
    description: "AI summary of your day ahead",
  },
  {
    id: "plan" as const,
    icon: Calendar,
    title: "Daily Plan",
    description: "Schedule tasks into free slots",
  },
  {
    id: "sync" as const,
    icon: RefreshCw,
    title: "Sync Tasks",
    description: "Pull latest from Todoist",
  },
  {
    id: "weekly" as const,
    icon: Sparkles,
    title: "Weekly Review",
    description: "Progress report and insights",
  },
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [tasks, setTasks] = useState<Record<string, unknown>[]>([]);
  const [brief, setBrief] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

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
        <Glass glow className="card-with-accent h-full p-6 md:p-8">
          <CardAccent variant="sage" />
          <p className="greeting-text">{greeting}</p>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="icon-badge">
                <AnimatedIcon icon={Sun} className="h-5 w-5" />
              </div>
              <div>
                <h2 className="display-lg text-heading">Command Center</h2>
                <p className="text-body text-muted">Your daily AI briefing & actions</p>
              </div>
            </div>
            <Pill tone={health?.ok ? "ok" : "warn"} pulse={health?.ok}>
              {health?.ok ? "Live" : "Offline"}
            </Pill>
          </div>

          <div className="action-grid mt-8">
            {actions.map(({ id, icon, title, description }) => (
              <button
                key={id}
                type="button"
                className="action-card"
                disabled={!!busy}
                onClick={() => run(id)}
              >
                <span className="action-card-icon">
                  {busy === id ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <AnimatedIcon icon={icon} className="h-5 w-5" variant="bounce" />
                  )}
                </span>
                <span className="action-card-title">{title}</span>
                <span className="action-card-desc">{description}</span>
              </button>
            ))}
          </div>

          {busy ? <PageLoader /> : null}
          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

          <div className="section-divider section-divider--inset mt-6" />

          <div className="panel-inner mt-5 p-5">
            {brief ? (
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-muted">{brief}</pre>
            ) : (
              <div className="empty-state">
                <EmptyIllustration />
                <p className="text-sm text-muted-2">Pick an action above to generate your plan</p>
              </div>
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
        <Glass className="card-with-accent flex h-full flex-col justify-between p-6">
          <CardAccent variant="sky" />
          <div className="icon-badge">
            <AnimatedIcon icon={CheckCircle2} className="h-5 w-5" />
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
        <Glass className="card-with-accent flex h-full flex-col justify-between p-6">
          <CardAccent variant="sand" />
          <div className="icon-badge">
            <AnimatedIcon icon={CheckCircle2} className="h-5 w-5" />
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
          <div className="section-divider section-divider--inset mb-5" />
          <div className="mb-5 flex items-center justify-between">
            <h2 className="display-lg text-heading">Pending tasks</h2>
            <Pill>{tasks.length} active</Pill>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state py-6">
              <EmptyIllustration />
              <p className="text-sm text-muted-2">No pending tasks — ingest a PDF or chat to get started</p>
            </div>
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
