"use client";

import { useMemo, useState } from "react";
import { RoadmapBoardData, RoadmapBoardItem, RoadmapBoardStatus, Sprint } from "@/lib/types";

type RoadmapGridClientProps = {
  board: RoadmapBoardData;
  currentSprint: Sprint | null;
  previousSprint: Sprint | null;
};

type ViewMode = "initiatives" | "goals";

const statusStyles: Record<RoadmapBoardStatus, string> = {
  on_track: "bg-emerald-100 text-emerald-800 border-emerald-200",
  at_risk: "bg-amber-100 text-amber-800 border-amber-200",
  not_started: "bg-slate-200 text-slate-700 border-slate-300",
  completed: "bg-sky-100 text-sky-800 border-sky-200",
};

const statusLabels: Record<RoadmapBoardStatus, string> = {
  on_track: "On track",
  at_risk: "At risk",
  not_started: "Not started",
  completed: "Completed",
};

const quarterPalette: Record<string, string> = {
  Q1: "bg-violet-100 text-violet-800 border-violet-200",
  Q2: "bg-amber-100 text-amber-800 border-amber-200",
  Q3: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Q4: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Backlog: "bg-slate-200 text-slate-700 border-slate-300",
};

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function quarterClass(quarter: string): string {
  if (quarter === "Backlog") {
    return quarterPalette.Backlog;
  }

  const key = quarter.split(",")[0] as "Q1" | "Q2" | "Q3" | "Q4";
  return quarterPalette[key] ?? "bg-slate-200 text-slate-700 border-slate-300";
}

function matchesStatus(statusFilter: string, status: RoadmapBoardStatus): boolean {
  if (statusFilter === "all") {
    return true;
  }
  return statusFilter === status;
}

export function RoadmapGridClient({ board, currentSprint, previousSprint }: RoadmapGridClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("initiatives");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredGroups = useMemo(
    () =>
      board.groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            const quarterMatch = quarterFilter === "all" || item.quarter === quarterFilter;
            const statusMatch = matchesStatus(statusFilter, item.status);
            return quarterMatch && statusMatch;
          }),
        }))
        .filter((group) => group.items.length > 0),
    [board.groups, quarterFilter, statusFilter],
  );

  const flatItems = filteredGroups.flatMap((group) => group.items);
  const summaryProgress = average(flatItems.map((item) => item.progress));
  const atRiskCount = flatItems.filter((item) => item.status === "at_risk").length;

  return (
    <div className="-mx-4 min-h-[calc(100vh-90px)] bg-[#f3f4f6] sm:-mx-6 lg:-mx-8">
      <header className="border-b border-slate-300 bg-white">
        <div className="flex min-h-16 items-center justify-between px-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400 bg-amber-300 text-sm font-bold text-slate-900">
              ✓
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">{board.title}</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
            <span>Data</span>
            <span>Automations</span>
            <span>Interfaces</span>
            <span>Forms</span>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-300 bg-[#f5edd7] px-5 py-3 sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("goals")}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              viewMode === "goals"
                ? "border-amber-500 bg-amber-100 text-slate-900"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            Goals
          </button>
          <button
            type="button"
            onClick={() => setViewMode("initiatives")}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              viewMode === "initiatives"
                ? "border-emerald-500 bg-emerald-100 text-slate-900"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            Initiatives
          </button>
          <span className="ml-2 text-sm text-slate-600">+ Add or import</span>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-160px)] grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-r border-slate-300 bg-[#f8f9fb] p-4">
          <button className="mb-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800">
            Create new...
          </button>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Find a view</p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setViewMode("initiatives")}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                viewMode === "initiatives" ? "bg-slate-200 font-semibold text-slate-900" : "text-slate-700"
              }`}
            >
              1. Review all initiatives
            </button>
            <button
              type="button"
              onClick={() => setViewMode("goals")}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                viewMode === "goals" ? "bg-slate-200 font-semibold text-slate-900" : "text-slate-700"
              }`}
            >
              2. See all goals and related info
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-slate-300 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Filters</p>
            <label className="mt-3 block text-xs font-medium text-slate-600">
              Quarter
              <select
                value={quarterFilter}
                onChange={(event) => setQuarterFilter(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="all">All quarters</option>
                {board.quarters.map((quarter) => (
                  <option key={quarter} value={quarter}>
                    {quarter}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-slate-600">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="on_track">On track</option>
                <option value="at_risk">At risk</option>
                <option value="not_started">Not started</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setQuarterFilter("all");
                setStatusFilter("all");
              }}
              className="mt-3 w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm"
            >
              Reset filters
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700">
            <p>Rows: {flatItems.length}</p>
            <p>Progress: {summaryProgress}%</p>
            <p>At risk: {atRiskCount}</p>
          </div>
        </aside>

        <section className="overflow-x-auto">
          <div className="min-w-[1100px]">
            <div className="flex items-center justify-between border-b border-slate-300 bg-white px-4 py-3">
              <p className="text-lg font-semibold text-slate-900">
                {viewMode === "initiatives" ? "Review all initiatives" : "See all goals and related info"}
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>Hide fields</span>
                <span>Filter</span>
                <span>Group</span>
                <span>Sort</span>
                <span>Color</span>
              </div>
            </div>

            {viewMode === "initiatives" ? (
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[#f8f9fb]">
                  <tr className="border-b border-slate-300">
                    <th className="w-16 px-4 py-3 font-semibold text-slate-700">#</th>
                    <th className="w-[360px] px-4 py-3 font-semibold text-slate-700">Initiative</th>
                    <th className="w-[120px] px-4 py-3 font-semibold text-slate-700">Quarter</th>
                    <th className="w-[130px] px-4 py-3 font-semibold text-slate-700">Status</th>
                    <th className="w-[120px] px-4 py-3 font-semibold text-slate-700">% complete</th>
                    <th className="w-[160px] px-4 py-3 font-semibold text-slate-700">Lead</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <GroupRows key={group.epic} epic={group.epic} items={group.items} />
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[#f8f9fb]">
                  <tr className="border-b border-slate-300">
                    <th className="w-16 px-4 py-3 font-semibold text-slate-700">#</th>
                    <th className="w-[360px] px-4 py-3 font-semibold text-slate-700">Team goal</th>
                    <th className="w-[420px] px-4 py-3 font-semibold text-slate-700">Linked initiatives</th>
                    <th className="w-[180px] px-4 py-3 font-semibold text-slate-700">Executive sponsor</th>
                    <th className="w-[130px] px-4 py-3 font-semibold text-slate-700">Status</th>
                    <th className="w-[120px] px-4 py-3 font-semibold text-slate-700">% complete</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group, index) => {
                    const status = group.items.some((item) => item.status === "at_risk") ? "at_risk" : "on_track";
                    const progress = average(group.items.map((item) => item.progress));
                    const notes = group.items.slice(0, 2).map((item) => item.notes[0]).filter(Boolean);

                    return (
                      <tr key={group.epic} className="border-b border-slate-300 bg-white align-top">
                        <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{group.epic}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {group.items.slice(0, 4).map((item) => (
                              <span key={item.id} className="rounded bg-sky-100 px-2 py-0.5 text-xs text-slate-800">
                                {item.initiative}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{group.items[0]?.lead ?? "Unassigned"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${statusStyles[status]}`}>
                            {statusLabels[status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800">{progress}%</td>
                        <td className="px-4 py-3">
                          <ul className="list-disc space-y-1 pl-4 text-slate-700">
                            {notes.map((note) => (
                              <li key={`${group.epic}-${note}`}>{note}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="border-t border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{board.totalItems} initiatives · Source: {board.sourceSheet}</span>
              <span>
                Current sprint: {currentSprint?.title ?? "-"} · Previous sprint: {previousSprint?.title ?? "-"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function GroupRows({ epic, items }: { epic: string; items: RoadmapBoardItem[] }) {
  return (
    <>
      <tr className="border-b border-slate-300 bg-[#eef1f5]">
        <td className="px-4 py-2 text-slate-500" colSpan={7}>
          <span className="font-semibold text-slate-700">{epic}</span>
          <span className="ml-2 text-xs text-slate-500">({items.length} initiatives)</span>
        </td>
      </tr>
      {items.map((item) => (
        <tr key={item.id} className="border-b border-slate-200 bg-white align-top hover:bg-slate-50">
          <td className="px-4 py-3 text-slate-500">{item.id}</td>
          <td className="px-4 py-3">
            <p className="font-medium text-slate-900">{item.initiative}</p>
            <p className="mt-1 text-xs text-slate-500">Target: {item.targetDate}</p>
          </td>
          <td className="px-4 py-3">
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${quarterClass(item.quarter)}`}>
              {item.quarter}
            </span>
          </td>
          <td className="px-4 py-3">
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${statusStyles[item.status]}`}>
              {statusLabels[item.status]}
            </span>
          </td>
          <td className="px-4 py-3 text-slate-800">{item.progress}%</td>
          <td className="px-4 py-3 text-slate-700">{item.lead}</td>
          <td className="px-4 py-3">
            <ul className="list-disc space-y-1 pl-4 text-slate-700">
              {item.notes.slice(0, 3).map((note) => (
                <li key={`${item.id}-${note}`}>{note}</li>
              ))}
            </ul>
          </td>
        </tr>
      ))}
    </>
  );
}