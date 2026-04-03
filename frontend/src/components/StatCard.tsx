type Props = {
  label: string;
  value: string;
  tone: string;
};

export function StatCard({ label, value, tone }: Props) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-soft transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(148,163,184,0.18)]">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
        {label}
      </div>
      <p className="mt-4 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}
