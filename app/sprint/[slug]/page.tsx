import { notFound } from "next/navigation";
import { HealthBadge } from "@/components/HealthBadge";
import { SectionCard } from "@/components/SectionCard";
import { getSprintBySlug, getSprints } from "@/lib/content";

type PageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const sprints = await getSprints();
  return sprints.map((sprint) => ({ slug: sprint.slug }));
}

export default async function SprintDetailPage({ params }: PageProps) {
  const sprint = await getSprintBySlug(params.slug);

  if (!sprint) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl2 border border-line bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{sprint.title}</h1>
          <HealthBadge health={sprint.health} />
        </div>
        <p className="mt-3 text-sm text-muted">{sprint.goal}</p>
        <p className="mt-2 text-sm leading-6">{sprint.summary}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Completed Items" items={sprint.completed} tone="positive" />
        <SectionCard title="In Progress" items={sprint.inProgress} tone="neutral" />
        <SectionCard title="Risks & Blockers" items={sprint.risks} tone="warning" />
        <SectionCard title="Learnings & Notes" items={sprint.learnings} tone="neutral" />
      </section>

      <section className="rounded-xl2 border border-line bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Sprint Health Progress</p>
          <p className="text-sm text-muted">{sprint.progress}%</p>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-line">
          <div
            className="h-2 rounded-full bg-ink/80"
            style={{ width: `${Math.min(Math.max(sprint.progress, 0), 100)}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted">{sprint.healthNote}</p>
      </section>

      {sprint.reviewDate || (sprint.nextSprintGoals && sprint.nextSprintGoals.length > 0) ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl2 border border-line bg-card p-6 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Sprint Review</h2>
            <p className="mt-3 text-sm">{sprint.reviewDate ?? "-"}</p>
          </article>
          <article className="rounded-xl2 border border-line bg-card p-6 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Next Sprint Goals</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {(sprint.nextSprintGoals ?? []).map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}
    </div>
  );
}
