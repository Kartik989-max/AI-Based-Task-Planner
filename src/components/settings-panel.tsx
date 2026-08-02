"use client";

import { useEffect, useState } from "react";
import { Calendar, Code2 } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion";
import { Btn, Field, Glass, Input, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";

export function SettingsPanel() {
  const [connected, setConnected] = useState(false);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [leetcode, setLeetcode] = useState({ problem_slug: "", title: "", difficulty: "Medium" });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    Promise.all([api.calendarStatus(), api.calendarSlots()])
      .then(([status, cal]) => {
        setConnected(status.connected);
        setSlots(cal.slots);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function connectGoogle() {
    setConnecting(true);
    try {
      const { url } = await api.googleAuthUrl();
      window.location.href = url;
    } catch {
      setConnecting(false);
    }
  }

  async function logSolve(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    try {
      const res = await api.logLeetcode(leetcode);
      setMessage(`Logged. Total solves: ${res.stats.total}`);
      setLeetcode({ ...leetcode, problem_slug: "", title: "" });
    } finally {
      setLogging(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <Stagger className="grid gap-6 lg:grid-cols-2">
      <StaggerItem>
        <Glass glow className="p-6 md:p-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-heading">Google Calendar</h2>
          </div>
          <p className="mt-1 text-sm text-muted">OAuth for free-window scheduling</p>

          <div className="info-box mt-4">
            <strong>For all customers (not just you):</strong> In Google Cloud Console → OAuth consent screen → click{" "}
            <strong>Publish App</strong>. Calendar access needs Google verification (1–4 weeks). Until then, only test
            users can connect.{" "}
            <a href="https://support.google.com/cloud/answer/10311615" target="_blank" rel="noreferrer">
              Google verification guide
            </a>
          </div>

          <p className="mt-4 text-sm text-muted">Status: {connected ? "Connected" : "Not connected"}</p>
          <Btn className="mt-4" loading={connecting} onClick={connectGoogle}>
            Connect Google
          </Btn>
          {slots.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <span key={`${slot.start}-${slot.end}`} className="slot-chip">
                  {slot.start} – {slot.end}
                </span>
              ))}
            </div>
          ) : null}
        </Glass>
      </StaggerItem>

      <StaggerItem>
        <Glass className="p-6 md:p-8">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-heading">LeetCode log</h2>
          </div>
          <p className="mt-1 text-sm text-muted">Track solves toward interview goals</p>
          <form className="mt-5 space-y-4" onSubmit={logSolve}>
            <Field label="Slug">
              <Input
                value={leetcode.problem_slug}
                onChange={(e) => setLeetcode({ ...leetcode, problem_slug: e.target.value })}
                placeholder="two-sum"
                required
              />
            </Field>
            <Field label="Title">
              <Input
                value={leetcode.title}
                onChange={(e) => setLeetcode({ ...leetcode, title: e.target.value })}
                placeholder="Two Sum"
                required
              />
            </Field>
            <Field label="Difficulty">
              <Input
                value={leetcode.difficulty}
                onChange={(e) => setLeetcode({ ...leetcode, difficulty: e.target.value })}
              />
            </Field>
            <Btn type="submit" loading={logging}>
              Log solve
            </Btn>
            {message ? <p className="text-sm text-emerald-500">{message}</p> : null}
          </form>
        </Glass>
      </StaggerItem>
    </Stagger>
  );
}
