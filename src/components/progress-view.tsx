"use client";

import { useEffect, useState } from "react";
import { Code2, Target, Trophy } from "lucide-react";
import { Float, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Glass, Pill, ProgressBar, Skeleton } from "@/components/ui";
import { api, type Progress as GoalProgress } from "@/lib/api";

export function ProgressView() {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.progress()
      .then(setProgress)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const byDiff = progress?.leetcode.by_difficulty || {};

  if (loading) {
    return (
      <div className="bento-asymmetric">
        <Skeleton className="bento-span-8 bento-row-2 h-72" />
        <Skeleton className="bento-span-4 h-72" />
      </div>
    );
  }

  return (
    <Stagger className="bento-asymmetric">
      <StaggerItem className="bento-span-8 bento-row-2">
        <Float>
          <Glass glow tilt className="flex h-full flex-col justify-between p-8 md:p-10">
            <div className="flex items-center gap-3">
              <div className="icon-badge">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="display-lg text-heading">Mission progress</h2>
            </div>

            <p className="mt-6 text-body text-muted">{progress?.main_goal || "Complete Setup to set your mission"}</p>

            <div className="mt-8 grid grid-cols-3 gap-6">
              <div>
                <p className="stat-num">{progress?.progress_pct ?? 0}%</p>
                <p className="stat-label mt-2">Complete</p>
              </div>
              <div>
                <p className="stat-num">{progress?.completed ?? 0}</p>
                <p className="stat-label mt-2">Done</p>
              </div>
              <div>
                <p className="stat-num">{progress?.pending ?? 0}</p>
                <p className="stat-label mt-2">Left</p>
              </div>
            </div>

            <div className="mt-8">
              <ProgressBar value={progress?.progress_pct || 0} />
            </div>
          </Glass>
        </Float>
      </StaggerItem>

      <StaggerItem className="bento-span-4">
        <Reveal>
          <Glass tilt className="flex h-full flex-col p-8">
            <div className="flex items-center gap-3">
              <div className="icon-badge">
                <Code2 className="h-5 w-5" />
              </div>
              <h2 className="display-lg text-heading">LeetCode</h2>
            </div>

            <div className="mt-auto pt-8">
              <div className="flex items-end gap-2">
                <Trophy className="mb-2 h-6 w-6 text-accent" />
                <p className="stat-num">{progress?.leetcode.total ?? 0}</p>
              </div>
              <p className="stat-label mt-2">Problems solved</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {Object.keys(byDiff).length === 0 ? (
                  <Pill>Start logging in Config</Pill>
                ) : (
                  Object.entries(byDiff).map(([diff, count]) => (
                    <Pill key={diff}>
                      {diff}: {count}
                    </Pill>
                  ))
                )}
              </div>
            </div>
          </Glass>
        </Reveal>
      </StaggerItem>
    </Stagger>
  );
}
