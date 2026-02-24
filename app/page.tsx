import Link from "next/link";
import { HealthBadge } from "@/components/HealthBadge";
import { getSprints } from "@/lib/content";

export default async function HomePage() {
  const sprints = await getSprints();
  const [currentSprint] = sprints;

  if (!currentSprint) {
    return (
      <div className="rounded-xl2 border border-line bg-card p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight">Maistro Bulten</h1>
        <p className="mt-2 text-sm text-muted">No sprint content found. Add markdown files to content/sprints.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="marquee-wrap text-sm font-medium text-amber-800">
          <div className="marquee-track">
            15.04.2026 - Product MVP Launch Workup Bulusmasi. Herkesi bekleriz.
          </div>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-card p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Maistro Bulten</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{currentSprint.title}</h1>
          <HealthBadge health={currentSprint.health} />
        </div>
        <p className="mt-3 text-sm text-muted">{currentSprint.goal}</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-line bg-canvas p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Current Sprint Summary</p>
            <p className="mt-2 text-sm leading-6">{currentSprint.summary}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Completion Rate</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">63%</p>
            <p className="mt-1 text-xs text-muted">Completed vs in-progress items</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Risk Load</p>
            <p
              className="mt-2 inline-flex cursor-help items-center gap-2 text-2xl font-semibold tracking-tight"
              title="Tum altyapinin degismesi kaynakli alinan buyuk tasklarin bir sonraki sprinte kaymasi"
            >
              1 <span className="text-sm text-muted">i</span>
            </p>
            <p className="mt-1 text-xs text-muted">Open risks in current sprint</p>
          </div>
        </div>

        <div className="mt-5 h-2 w-full rounded-full bg-line">
          <div className="h-2 rounded-full bg-ink/80" style={{ width: "63%" }} />
        </div>
        <p className="mt-2 text-xs text-muted">Overall progress 63%</p>

        <div className="mt-6">
          <Link
            href={`/sprint/${currentSprint.slug}`}
            className="inline-flex items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-medium hover:bg-canvas"
          >
            Open Current Sprint
          </Link>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-card p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Previous Sprint Highlight</p>
        <div className="mt-3 flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Sprint 2</h2>
          <HealthBadge health="green" />
        </div>
        <p className="mt-2 text-sm text-muted">03.02.2026 - 17.02.2026</p>
        <p className="mt-3 text-sm">
          Hedef: Yeni AMP ve SDK v2 mimari altyapisinin tasarlanmasi; MVPnin belirlenmesi.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Sprint Review</h2>
          <p className="mt-3 text-sm">
            Review tarihi:{" "}
            <span className="font-medium">
              {currentSprint.reviewDate ? currentSprint.reviewDate : "03.03.2026"}
            </span>
          </p>
        </article>
        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Next Sprint Goal</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {(currentSprint.nextSprintGoals && currentSprint.nextSprintGoals.length > 0
              ? currentSprint.nextSprintGoals
              : [
                  "Yeni Maistro 2.0 surumunde RAG altyapisinin kazandirilmasi",
                  "LTM altyapisinin saglanmasi",
                  "Local/External/Hybrid Guardrails entegrasyonlari",
                  "Tool/MCP Governance konularinin takip edilmesi",
                ]
            ).map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Roadmap Link</h2>
          <p className="mt-3 text-sm text-muted">Track quarter strategy, dependencies, and future plans in the overview board.</p>
          <Link href="/roadmap" className="mt-4 inline-flex rounded-md border border-line px-4 py-2 text-sm hover:bg-canvas">
            Open Roadmap Overview
          </Link>
        </article>

        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Archive</h2>
          <p className="mt-3 text-sm text-muted">Sprint kartlari kaldirildi. Arsive buradan gecis yapabilirsin.</p>
          <Link href="/archive" className="mt-4 inline-flex rounded-md border border-line px-4 py-2 text-sm hover:bg-canvas">
            Open Archive
          </Link>
        </article>
      </section>
    </div>
  );
}
