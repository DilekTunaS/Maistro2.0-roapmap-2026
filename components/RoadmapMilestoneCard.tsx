import { RoadmapMilestone } from "@/lib/types";

type RoadmapMilestoneCardProps = {
  milestone: RoadmapMilestone;
};

export function RoadmapMilestoneCard({ milestone }: RoadmapMilestoneCardProps) {
  return (
    <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{milestone.month}</p>
      <h3 className="mt-2 text-base font-semibold">{milestone.title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
        {milestone.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
