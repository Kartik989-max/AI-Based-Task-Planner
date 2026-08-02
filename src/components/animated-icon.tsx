"use client";

import type { LucideIcon } from "lucide-react";

type AnimatedIconProps = {
  icon: LucideIcon;
  className?: string;
  variant?: "scale" | "bounce";
};

export function AnimatedIcon({ icon: Icon, className = "h-5 w-5", variant = "scale" }: AnimatedIconProps) {
  return (
    <span className={`animated-icon animated-icon--${variant} ${className}`.trim()} aria-hidden>
      <Icon className="h-full w-full" strokeWidth={1.75} />
    </span>
  );
}
