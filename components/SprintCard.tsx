import Link from "next/link";
import { HealthBadge } from "@/components/HealthBadge";
import { Sprint } from "@/lib/types";

type SprintCardProps = {
  sprint: Sprint;
  highlighted?: boolean;
};

export function SprintCard({ sprint, highlighted = false }: SprintCardProps) {
  return (
    <Link
      href={`/sprint/${sprint.slug}`}
      className="block rounded-xl2 border border-line bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-ink/20"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-6">{sprint.title}</h3>
        <HealthBadge health={sprint.health} compact />
      </div>
      <p className="mt-2 text-sm text-muted">{sprint.goal}</p>
      <p className="mt-3 text-sm leading-6">{sprint.summary}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>{sprint.rangeLabel}</span>
        {highlighted ? <span className="rounded bg-ink px-2 py-1 text-white">Latest</span> : null}
      </div>
    </Link>
  );
}
