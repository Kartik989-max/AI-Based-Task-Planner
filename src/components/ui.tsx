import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Glass({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return <div className={`glass ${glow ? "glass-glow" : ""} ${className}`.trim()}>{children}</div>;
}

export function Btn({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`glass-btn ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function BtnGhost({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`glass-btn-ghost ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-white/55">{label}</span>
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`glass-input ${className}`.trim()} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`glass-input glass-select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="glass-progress">
      <div className="glass-progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "ok" | "warn" }) {
  const toneClass = tone === "ok" ? "pill-ok" : tone === "warn" ? "pill-warn" : "";
  return <span className={`pill ${toneClass}`}>{children}</span>;
}
