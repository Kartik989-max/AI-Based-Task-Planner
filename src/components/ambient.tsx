export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden>
      <div className="shape shape-1" />
      <div className="shape shape-2" />
      <div className="shape shape-3" />
      <div className="shape shape-4" />
      <div className="shape shape-rect shape-rect-1" />
      <div className="shape shape-rect shape-rect-2" />
      <svg className="shape-ring shape-ring-1" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg className="shape-ring shape-ring-2" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function CardAccent({ variant = "sage" }: { variant?: "sage" | "sky" | "sand" }) {
  return (
    <div className={`card-accent card-accent--${variant}`} aria-hidden>
      <div className="card-accent-blob" />
      <svg className="card-accent-ring" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function EmptyIllustration() {
  return (
    <svg className="empty-illustration" viewBox="0 0 120 80" fill="none" aria-hidden>
      <rect x="20" y="16" width="48" height="6" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="20" y="30" width="72" height="6" rx="3" fill="currentColor" opacity="0.12" />
      <rect x="20" y="44" width="56" height="6" rx="3" fill="currentColor" opacity="0.08" />
      <circle cx="92" cy="52" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <circle cx="92" cy="52" r="6" fill="currentColor" opacity="0.15" />
    </svg>
  );
}
