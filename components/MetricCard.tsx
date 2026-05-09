type MetricCardProps = {
  label: string;
  value: string;
  tone?: "aqua" | "lime" | "amber" | "danger";
  note?: string;
};

const tones = {
  aqua: "text-aqua",
  lime: "text-lime",
  amber: "text-amber",
  danger: "text-danger"
};

export default function MetricCard({ label, value, tone = "aqua", note }: MetricCardProps) {
  return (
    <section className="rounded-md border border-line bg-panel p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-normal ${tones[tone]}`}>{value}</p>
      {note ? <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p> : null}
    </section>
  );
}
