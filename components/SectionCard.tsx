type SectionCardProps = {
  title: string;
  items: string[];
  tone: "positive" | "neutral" | "warning";
};

const toneClassMap: Record<SectionCardProps["tone"], string> = {
  positive: "border-emerald-200 bg-emerald-50/50",
  neutral: "border-line bg-white",
  warning: "border-amber-200 bg-amber-50/50",
};

export function SectionCard({ title, items, tone }: SectionCardProps) {
  return (
    <article className={`rounded-xl2 border p-5 shadow-card ${toneClassMap[tone]}`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">{title}</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
