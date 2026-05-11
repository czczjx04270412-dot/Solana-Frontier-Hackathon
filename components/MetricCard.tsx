type MetricCardProps = {
  label: string;
  value: string;
  tone?: "aqua" | "lime" | "amber" | "danger";
};

const tones = {
  aqua: "text-aqua",
  lime: "text-lime",
  amber: "text-amber",
  danger: "text-danger"
};

export default function MetricCard({ label, value, tone = "aqua" }: MetricCardProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-glow">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </section>
  );
}
