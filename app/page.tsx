import Link from "next/link";
import { HealthBadge } from "@/components/HealthBadge";
import { getSprints } from "@/lib/content";

export default async function HomePage() {
  const sprints = await getSprints();
  const [currentSprint] = sprints;
  const sprintOutputVideoUrl = "";
  const governancePdfUrl = "/uploads/genai-yonetisim-v15-20260225_115606.pdf";

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

      <section className="overflow-hidden rounded-3xl border border-[#1f2a44] bg-gradient-to-br from-[#0a1124] via-[#141f3b] to-[#1b2647] p-5 text-white shadow-card sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/80">Sprint Ciktilari</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <h2 className="border-l-2 border-blue-200 pl-3 text-2xl font-semibold leading-tight sm:text-4xl">
              E2E Build Your Agent w Maistro
            </h2>
            <p className="text-sm leading-7 text-blue-100/90 sm:text-base">
              Sprintte agent olusturma ve platform akislarinin uca uca netlestirilmesi hedeflendi. Video alani hazir;
              demo yuku geldigi anda ayni karttan oynatilabilecek.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-blue-100">Build output</p>
                <p className="mt-2 text-sm text-white/90">E2E Build Your Agent w Maistro</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-blue-100">Video stream</p>
                <p className="mt-2 text-sm text-white/90">IsVector destekli RAG agent</p>
              </article>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-3">
            <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl bg-slate-900/70">
              {sprintOutputVideoUrl ? (
                <video className="h-full w-full object-cover" controls preload="metadata">
                  <source src={sprintOutputVideoUrl} />
                </video>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
                  <div className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold">PLAY</div>
                  <p className="text-sm text-blue-100">Video yakinda eklenecek</p>
                  <p className="text-xs text-blue-100/70">IsVector destekli RAG agent</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Proje Dokumanlari</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li>
              <span className="font-medium">UI: </span>
              <a
                href="https://www.figma.com/make/Neyklq0zPaU06WEJ5qPJ0B/Agentic-Platform-Prototyping?p=f&t=kwfIGoCNXFlBywKD-0&fullscreen=1&preview-route=%2Fmonitoring%2Fguardrails"
                target="_blank"
                rel="noreferrer"
                className="break-all text-sky-700 underline"
              >
                Figma - Agentic Platform Prototyping
              </a>
            </li>
            <li>
              <span className="font-medium">Mimari tasarimlar: </span>
              <a
                href="https://app.diagrams.net/#G1C72TworyvRaF6AY4wC0gRCjwKQcYVQwh#%7B%22pageId%22%3A%22h4GeDd_XzQrO6BEMET3O%22%7D"
                target="_blank"
                rel="noreferrer"
                className="break-all text-sky-700 underline"
              >
                diagrams.net architecture board
              </a>
            </li>
            <li>
              <span className="font-medium">Platform Linki: </span>
              <a
                href="https://genai.softtech.com.tr/v2/agents"
                target="_blank"
                rel="noreferrer"
                className="break-all text-sky-700 underline"
              >
                genai.softtech.com.tr/v2/agents
              </a>
            </li>
            <li>
              <span className="font-medium">AI Governance Backlog: </span>
              <a
                href="https://jira.isbank/confluence/pages/viewpage.action?pageId=753606555"
                target="_blank"
                rel="noreferrer"
                className="break-all text-sky-700 underline"
              >
                Confluence dokumani
              </a>
            </li>
          </ul>
        </article>

        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">AI Governance PDF Preview</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <iframe title="AI Governance Backlog PDF" src={governancePdfUrl} className="h-[380px] w-full bg-white" />
          </div>
          <a
            href={governancePdfUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-md border border-line px-4 py-2 text-sm hover:bg-canvas"
          >
            PDF yeni sekmede ac
          </a>
        </article>
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
