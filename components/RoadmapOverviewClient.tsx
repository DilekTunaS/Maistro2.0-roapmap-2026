"use client";

import { useMemo, useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { RoadmapInitiativeCard } from "@/components/RoadmapInitiativeCard";
import { calculateInitiativeProgress, isInitiativeAtRisk } from "@/lib/roadmap-metrics";
import { InitiativeStatus, Roadmap, RoadmapInitiative, Sprint } from "@/lib/types";

type RoadmapOverviewClientProps = {
  roadmap: Roadmap;
  currentSprint: Sprint | null;
  previousSprint: Sprint | null;
};

type InitiativeWithLane = RoadmapInitiative & {
  lane: string;
  progress: number;
  atRisk: boolean;
};

const monthOrder: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

const statusOptions: Array<{ value: InitiativeStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function RoadmapOverviewClient({
  roadmap,
  currentSprint,
  previousSprint,
}: RoadmapOverviewClientProps) {
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<InitiativeStatus | "all">("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const allInitiatives = useMemo<InitiativeWithLane[]>(
    () =>
      roadmap.lanes.flatMap((lane) =>
        lane.items.map((initiative) => {
          const progress = calculateInitiativeProgress(initiative.completed, initiative.total);
          return {
            ...initiative,
            lane: lane.lane,
            progress,
            atRisk: isInitiativeAtRisk(
              initiative.status,
              progress,
              initiative.dependencies.length,
            ),
          };
        }),
      ),
    [roadmap.lanes],
  );

  const owners = useMemo(
    () =>
      Array.from(new Set(allInitiatives.map((initiative) => initiative.owner))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [allInitiatives],
  );

  const months = useMemo(
    () =>
      Array.from(new Set(allInitiatives.map((initiative) => initiative.month))).sort((a, b) => {
        const aRank = monthOrder[a] ?? 99;
        const bRank = monthOrder[b] ?? 99;
        if (aRank === bRank) {
          return a.localeCompare(b);
        }
        return aRank - bRank;
      }),
    [allInitiatives],
  );

  const filtered = useMemo(
    () =>
      allInitiatives.filter((initiative) => {
        const matchOwner = ownerFilter === "all" || initiative.owner === ownerFilter;
        const matchStatus = statusFilter === "all" || initiative.status === statusFilter;
        const matchMonth = monthFilter === "all" || initiative.month === monthFilter;
        return matchOwner && matchStatus && matchMonth;
      }),
    [allInitiatives, ownerFilter, statusFilter, monthFilter],
  );

  const filteredByLane = useMemo(
    () =>
      roadmap.lanes.map((lane) => ({
        lane: lane.lane,
        items: filtered.filter((initiative) => initiative.lane === lane.lane),
      })),
    [filtered, roadmap.lanes],
  );

  const portfolioProgress = average(filtered.map((initiative) => initiative.progress));
  const activeCount = filtered.filter((item) => item.status === "in_progress").length;
  const doneCount = filtered.filter((item) => item.status === "done").length;
  const atRiskCount = filtered.filter((item) => item.atRisk).length;

  return (
    <div className="space-y-6">
      <section className="rounded-xl2 border border-line bg-card p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Roadmap Overview
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{roadmap.quarter}</h1>
        <p className="mt-3 text-sm text-muted">North Star</p>
        <p className="mt-1 text-base leading-7">{roadmap.northStarGoal}</p>
        <p className="mt-4 rounded-lg border border-line bg-canvas p-4 text-sm leading-6 text-muted">
          {roadmap.strategyNarrative}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Portfolio Progress"
          value={`${portfolioProgress}%`}
          hint="Filtered initiative completion"
        />
        <KpiCard label="Active Initiatives" value={String(activeCount)} hint="Currently in progress" />
        <KpiCard label="Completed" value={String(doneCount)} hint="Initiatives delivered" />
        <KpiCard label="At Risk" value={String(atRiskCount)} hint="Needs attention now" />
      </section>

      <section className="rounded-xl2 border border-line bg-card p-5 shadow-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-medium text-muted">
              Owner
              <select
                className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                value={ownerFilter}
                onChange={(event) => setOwnerFilter(event.target.value)}
              >
                <option value="all">All Owners</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-muted">
              Status
              <select
                className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as InitiativeStatus | "all")
                }
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="h-10 rounded-md border border-line bg-white px-4 text-sm font-medium hover:bg-canvas"
              onClick={() => {
                setOwnerFilter("all");
                setStatusFilter("all");
                setMonthFilter("all");
              }}
              type="button"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Timeline</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMonthFilter("all")}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                monthFilter === "all"
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-muted"
              }`}
            >
              All Months
            </button>
            {months.map((month) => {
              const count = allInitiatives.filter((initiative) => initiative.month === month).length;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => setMonthFilter(month)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    monthFilter === month
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-muted"
                  }`}
                >
                  {month} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {filteredByLane.map((lane) => {
          const laneProgress = average(lane.items.map((item) => item.progress));
          const laneAtRisk = lane.items.filter((item) => item.atRisk).length;

          return (
            <article key={lane.lane} className="rounded-xl2 border border-line bg-card p-5 shadow-card">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                {lane.lane}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs text-muted">
                  Items {lane.items.length}
                </span>
                <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs text-muted">
                  Progress {laneProgress}%
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                  At risk {laneAtRisk}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {lane.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
                    No initiatives match the selected filters.
                  </p>
                ) : (
                  lane.items.map((initiative) => (
                    <RoadmapInitiativeCard
                      key={`${lane.lane}-${initiative.title}`}
                      initiative={initiative}
                      atRisk={initiative.atRisk}
                    />
                  ))
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Future Strategy
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            {roadmap.futureStrategy.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Previous Sprint Goals
          </h2>
          {previousSprint ? (
            <>
              <p className="mt-3 text-sm font-medium">{previousSprint.title}</p>
              <p className="mt-2 text-sm text-muted">{previousSprint.goal}</p>
              <p className="mt-2 text-sm text-muted">
                Completion {previousSprint.completionRate}%
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No previous sprint data available.</p>
          )}
          {currentSprint ? (
            <p className="mt-3 text-xs text-muted">
              Current sprint: {currentSprint.title} ({currentSprint.progress}%)
            </p>
          ) : null}
        </article>

        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Priorities
          </h2>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted">Must</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {roadmap.priorities.must.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted">Should</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {roadmap.priorities.should.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Risks & Dependencies
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            {roadmap.risksAndDependencies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Expected Business Impact
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            {roadmap.expectedBusinessImpact.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
