"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Btn, Field, Glass, Input, Select } from "@/components/ui";
import { api } from "@/lib/api";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

const defaultForm = {
  role: "student",
  work_start: "09:00",
  work_end: "18:00",
  deep_work_start: "07:00",
  deep_work_end: "09:00",
  main_goal: "",
  notification_style: "normal",
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  max_tasks_per_day: 4,
  timezone: "Asia/Kolkata",
  focus_day: "",
  morning_plan_hour: 8,
  side_goal_hours_per_day: 2,
  activity_split: { work: 30, study: 50, personal: 20 },
  work_days: ["mon", "tue", "wed", "thu", "fri"],
};

export function OnboardingForm() {
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.onboardStatus()
      .then((s) => {
        if (!s.onboarded) return;
        return api.profile().then((res) => setForm({ ...defaultForm, ...(res.profile as typeof defaultForm) }));
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      await api.onboard({
        ...form,
        focus_day: form.focus_day || null,
        max_tasks_per_day: Number(form.max_tasks_per_day),
        morning_plan_hour: Number(form.morning_plan_hour),
        side_goal_hours_per_day: Number(form.side_goal_hours_per_day),
      });
      setStatus("Profile saved — your AI planner is now personalized.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FadeIn>
      <Glass glow className="overflow-hidden p-6 md:p-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="icon-badge">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="display-lg text-heading">Personalize your planner</h2>
            <p className="text-body text-muted">Tell the AI how you work — it remembers everything</p>
          </div>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="both">Both</option>
            </Select>
          </Field>
          <Field label="Main goal">
            <Input
              value={form.main_goal}
              onChange={(e) => setForm({ ...form, main_goal: e.target.value })}
              placeholder="Crack FAANG interviews by Dec 2026"
            />
          </Field>
          <Field label="Work start">
            <Input
              type="time"
              value={form.work_start}
              onChange={(e) => setForm({ ...form, work_start: e.target.value })}
            />
          </Field>
          <Field label="Work end">
            <Input type="time" value={form.work_end} onChange={(e) => setForm({ ...form, work_end: e.target.value })} />
          </Field>
          <Field label="Deep work start">
            <Input
              type="time"
              value={form.deep_work_start}
              onChange={(e) => setForm({ ...form, deep_work_start: e.target.value })}
            />
          </Field>
          <Field label="Deep work end">
            <Input
              type="time"
              value={form.deep_work_end}
              onChange={(e) => setForm({ ...form, deep_work_end: e.target.value })}
            />
          </Field>
          <Field label="Quiet hours start">
            <Input
              type="time"
              value={form.quiet_hours_start}
              onChange={(e) => setForm({ ...form, quiet_hours_start: e.target.value })}
            />
          </Field>
          <Field label="Quiet hours end">
            <Input
              type="time"
              value={form.quiet_hours_end}
              onChange={(e) => setForm({ ...form, quiet_hours_end: e.target.value })}
            />
          </Field>
          <Field label="Max tasks / day">
            <Select
              value={String(form.max_tasks_per_day)}
              onChange={(e) => setForm({ ...form, max_tasks_per_day: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Focus day">
            <Input
              type="date"
              value={form.focus_day}
              onChange={(e) => setForm({ ...form, focus_day: e.target.value })}
            />
          </Field>
          <Field label="Notifications">
            <Select
              value={form.notification_style}
              onChange={(e) => setForm({ ...form, notification_style: e.target.value })}
            >
              <option value="gentle">Gentle</option>
              <option value="normal">Normal</option>
              <option value="focused">Focused</option>
            </Select>
          </Field>
          <Field label="Timezone">
            <Select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
              {[...new Set([form.timezone, ...TIMEZONES])].map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Btn type="submit" loading={saving}>
              Save & activate
            </Btn>
            {status ? <p className="mt-4 text-sm text-emerald-600">{status}</p> : null}
            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
          </div>
        </form>
      </Glass>
    </FadeIn>
  );
}
