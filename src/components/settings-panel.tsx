"use client";

import { useEffect, useState } from "react";
import { Calendar, Code2 } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion";
import { Btn, Field, Glass, Input } from "@/components/ui";
import { api } from "@/lib/api";

export function SettingsPanel() {
  const [connected, setConnected] = useState(false);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [leetcode, setLeetcode] = useState({ problem_slug: "", title: "", difficulty: "Medium" });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.calendarStatus()
      .then((r) => setConnected(r.connected))
      .catch(() => undefined);
    api.calendarSlots()
      .then((r) => setSlots(r.slots))
      .catch(() => undefined);
  }, []);

  async function connectGoogle() {
    const { url } = await api.googleAuthUrl();
    window.location.href = url;
  }

  async function logSolve(e: React.FormEvent) {
    e.preventDefault();
    const res = await api.logLeetcode(leetcode);
    setMessage(`Logged. Total solves: ${res.stats.total}`);
    setLeetcode({ ...leetcode, problem_slug: "", title: "" });
  }

  return (
    <Stagger className="grid gap-6 lg:grid-cols-2">
      <StaggerItem>
        <Glass glow className="p-6 md:p-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-300" />
            <h2 className="text-lg font-semibold text-white">Google Calendar</h2>
          </div>
          <p className="mt-1 text-sm text-white/55">OAuth for free-window scheduling</p>
          <p className="mt-4 text-sm text-white/70">Status: {connected ? "Connected" : "Not connected"}</p>
          <Btn className="mt-4" onClick={connectGoogle}>
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
            <Code2 className="h-5 w-5 text-violet-300" />
            <h2 className="text-lg font-semibold text-white">LeetCode log</h2>
          </div>
          <p className="mt-1 text-sm text-white/55">Track solves toward interview goals</p>
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
            <Btn type="submit">Log solve</Btn>
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          </form>
        </Glass>
      </StaggerItem>
    </Stagger>
  );
}
