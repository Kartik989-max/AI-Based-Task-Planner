"use client";

import { useEffect, useState } from "react";
import { Calendar, Code2 } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
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
      setMessage(`Logged · ${res.stats.total} total solves`);
      setLeetcode({ ...leetcode, problem_slug: "", title: "" });
    } finally {
      setLogging(false);
    }
  }

  if (loading) {
    return (
      <div className="bento-asymmetric md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <Stagger className="bento-asymmetric">
      <StaggerItem className="bento-span-5">
        <Reveal>
          <Glass glow tilt className="h-full p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="icon-badge">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="display-lg text-heading">Google Calendar</h2>
                <p className="text-body text-muted">Free-window scheduling</p>
              </div>
            </div>

            <div className="info-box mt-5">
              <strong>For all users:</strong> Publish your OAuth app in Google Cloud Console. Calendar scope requires
              Google verification (~1–4 weeks).{" "}
              <a href="https://support.google.com/cloud/answer/10311615" target="_blank" rel="noreferrer">
                Verification guide →
              </a>
            </div>

            <p className="mt-5 text-sm text-muted">
              Status: <span className="font-semibold text-heading">{connected ? "Connected" : "Not connected"}</span>
            </p>
            <Btn className="mt-4" loading={connecting} onClick={connectGoogle}>
              Connect Google
            </Btn>

            {slots.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <span key={`${slot.start}-${slot.end}`} className="slot-chip">
                    {slot.start} – {slot.end}
                  </span>
                ))}
              </div>
            ) : null}
          </Glass>
        </Reveal>
      </StaggerItem>

      <StaggerItem className="bento-span-7">
        <Reveal delay={0.08}>
          <Glass tilt className="h-full p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="icon-badge">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="display-lg text-heading">LeetCode tracker</h2>
                <p className="text-body text-muted">Log solves toward your goal</p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={logSolve}>
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
              {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
            </form>
          </Glass>
        </Reveal>
      </StaggerItem>
    </Stagger>
  );
}
