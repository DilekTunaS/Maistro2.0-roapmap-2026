import Link from "next/link";
import { readDb } from "@/lib/backlog-db";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export default async function DashboardPage() {
  const db = await readDb();

  const grouped = new Map<string, typeof db.initiatives>();
  for (const item of db.initiatives) {
    const list = grouped.get(item.quarter) ?? [];
    list.push(item);
    grouped.set(item.quarter, list);
  }

  const quarters = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  const customerCount = new Set(
    db.initiatives.map((i) => i.customer).filter((value) => value && value !== "Unassigned"),
  ).size;
  const roiDefined = db.initiatives.filter((i) => i.roiMetric || i.roiValue).length;
  const atRiskCount = db.initiatives.filter((i) => i.status === "at_risk").length;
  const completedCount = db.initiatives.filter((i) => i.status === "completed").length;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-card p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">C-Level Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Quarterly Strategy Performance</h1>
        <p className="mt-2 text-sm text-muted">Click any quarter to drill into roadmap details.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Total Initiatives" value={String(db.initiatives.length)} hint="Across all quarters" />
        <Kpi title="At Risk" value={String(atRiskCount)} hint="Needs executive intervention" />
        <Kpi title="Completed" value={String(completedCount)} hint="Delivered initiatives" />
        <Kpi title="Avg Progress" value={`${average(db.initiatives.map((i) => i.progress))}%`} hint="Portfolio completion" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Kpi title="Customer Coverage" value={String(customerCount)} hint="Distinct customer labels in roadmap" />
        <Kpi title="ROI Defined" value={`${roiDefined}/${db.initiatives.length}`} hint="Initiatives with ROI tracking fields" />
      </section>

      <section className="space-y-4">
        {quarters.map(([quarter, items]) => {
          const progress = average(items.map((item) => item.progress));
          const atRisk = items.filter((item) => item.status === "at_risk").length;
          const quarterCustomers = Array.from(
            new Set(items.map((item) => item.customer).filter((value) => value && value !== "Unassigned")),
          );
          const roiReady = items.filter((item) => item.roiMetric || item.roiValue).length;
          return (
            <article key={quarter} className="rounded-xl border border-line bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{quarter}</h2>
                  <p className="text-sm text-muted">Target overview and initiative health</p>
                </div>
                <Link href={`/roadmap?quarter=${encodeURIComponent(quarter)}`} className="rounded-md border border-line px-3 py-2 text-sm hover:bg-canvas">
                  View details
                </Link>
              </div>
              <div className="mt-4 h-3 w-full rounded-full bg-line">
                <div className="h-3 rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
                <span>Progress: {progress}%</span>
                <span>Initiatives: {items.length}</span>
                <span>At risk: {atRisk}</span>
                <span>ROI ready: {roiReady}</span>
              </div>
              {quarterCustomers.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {quarterCustomers.map((customer) => (
                    <span key={`${quarter}-${customer}`} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs text-sky-700">
                      {customer}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Kpi({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <article className="rounded-xl border border-line bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </article>
  );
}
