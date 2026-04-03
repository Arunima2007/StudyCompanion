export function AmbientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="ambient-orb ambient-orb-coral animate-float-slow" />
      <div className="ambient-orb ambient-orb-teal animate-float-delayed" />
      <div className="ambient-orb ambient-orb-sand animate-float-soft" />
      <div className="ambient-grid" />
    </div>
  );
}
