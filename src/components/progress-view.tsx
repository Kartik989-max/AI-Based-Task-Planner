"use client";

import { useEffect, useState } from "react";
import { Code2, Target } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Btn, Field, Glass, Input, Pill, ProgressBar } from "@/components/ui";
import { api, type Progress as GoalProgress } from "@/lib/api";

export function ProgressView() {
  const [progress, setProgress] = useState<GoalProgress | null>(null);

  useEffect(() => {
    api.progress().then(setProgress).catch(() => undefined);
  }, []);

  const byDiff = progress?.leetcode.by_difficulty || {};

  return (
    <Stagger className="grid gap-6 md:grid-cols-2">
      <StaggerItem>
        <Glass glow className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-indigo-200/80">
            <Target className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">Main goal</h2>
          </div>
          <p className="mt-4 text-base text-white/80">{progress?.main_goal || "No goal set — complete onboarding"}</p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="stat-num">{progress?.progress_pct ?? 0}%</p>
              <p className="mt-1 text-xs text-white/45">Progress</p>
            </div>
            <div>
              <p className="stat-num">{progress?.completed ?? 0}</p>
              <p className="mt-1 text-xs text-white/45">Done</p>
            </div>
            <div>
              <p className="stat-num">{progress?.pending ?? 0}</p>
              <p className="mt-1 text-xs text-white/45">Pending</p>
            </div>
          </div>
          <div className="mt-6">
            <ProgressBar value={progress?.progress_pct || 0} />
          </div>
        </Glass>
      </StaggerItem>

      <StaggerItem>
        <Glass className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-cyan-200/80">
            <Code2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">LeetCode</h2>
          </div>
          <p className="mt-4">
            <span className="stat-num">{progress?.leetcode.total ?? 0}</span>
            <span className="ml-2 text-sm text-white/50">total solves</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.keys(byDiff).length === 0 ? (
              <Pill>No solves logged yet</Pill>
            ) : (
              Object.entries(byDiff).map(([diff, count]) => (
                <Pill key={diff}>
                  {diff}: {count}
                </Pill>
              ))
            )}
          </div>
        </Glass>
      </StaggerItem>
    </Stagger>
  );
}
