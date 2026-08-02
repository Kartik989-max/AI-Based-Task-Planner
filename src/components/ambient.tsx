export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden>
      <div className="shape shape-sq shape-sq-1" />
      <div className="shape shape-tri shape-tri-1" />
    </div>
  );
}

export function EmptyIllustration() {
  return (
    <svg className="empty-illustration" viewBox="0 0 120 48" fill="none" aria-hidden>
      <rect x="20" y="8" width="48" height="5" rx="1" fill="currentColor" opacity="0.15" />
      <rect x="20" y="22" width="72" height="5" rx="1" fill="currentColor" opacity="0.1" />
      <rect x="20" y="36" width="56" height="5" rx="1" fill="currentColor" opacity="0.06" />
    </svg>
  );
}
