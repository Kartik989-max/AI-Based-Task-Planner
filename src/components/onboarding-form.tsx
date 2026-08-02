"use client";

import { useEffect, useState } from "react";
import { FadeIn } from "@/components/motion";
import { Btn, Field, Glass, Input, Select } from "@/components/ui";
import { api } from "@/lib/api";

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
    setStatus("Saving…");
    setError(null);
    try {
      await api.onboard({
        ...form,
        focus_day: form.focus_day || null,
        max_tasks_per_day: Number(form.max_tasks_per_day),
        morning_plan_hour: Number(form.morning_plan_hour),
        side_goal_hours_per_day: Number(form.side_goal_hours_per_day),
      });
      setStatus("Profile saved. LLM planning will use your preferences.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setStatus(null);
    }
  }

  return (
    <FadeIn>
      <Glass glow className="p-6 md:p-8">
        <h2 className="text-xl font-semibold text-white">Onboarding</h2>
        <p className="mt-1 text-sm text-white/55">Work hours, goals, quiet hours, and focus days</p>

        <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={submit}>
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
            <Input value={form.work_start} onChange={(e) => setForm({ ...form, work_start: e.target.value })} />
          </Field>
          <Field label="Work end">
            <Input value={form.work_end} onChange={(e) => setForm({ ...form, work_end: e.target.value })} />
          </Field>
          <Field label="Deep work start">
            <Input value={form.deep_work_start} onChange={(e) => setForm({ ...form, deep_work_start: e.target.value })} />
          </Field>
          <Field label="Deep work end">
            <Input value={form.deep_work_end} onChange={(e) => setForm({ ...form, deep_work_end: e.target.value })} />
          </Field>
          <Field label="Max tasks / day">
            <Input
              type="number"
              min={1}
              max={10}
              value={form.max_tasks_per_day}
              onChange={(e) => setForm({ ...form, max_tasks_per_day: Number(e.target.value) })}
            />
          </Field>
          <Field label="Focus day (YYYY-MM-DD)">
            <Input
              value={form.focus_day}
              onChange={(e) => setForm({ ...form, focus_day: e.target.value })}
              placeholder="2026-08-15"
            />
          </Field>
          <Field label="Notification style">
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
            <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Btn type="submit">Save profile</Btn>
            {status ? <p className="mt-3 text-sm text-emerald-300">{status}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          </div>
        </form>
      </Glass>
    </FadeIn>
  );
}
