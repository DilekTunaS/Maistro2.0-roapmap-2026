"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FloatingChatLauncher } from "@/components/FloatingChatLauncher";
import { InitiativeRecord } from "@/lib/types";

function quarterSortValue(quarter: string): number {
  const normalized = quarter.trim().toLowerCase();
  if (!normalized || normalized === "backlog") {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = quarter.match(/q\s*([1-4])\s*,?\s*(\d{4})/i);
  if (!match) {
    return Number.MAX_SAFE_INTEGER - 1;
  }

  const q = Number(match[1]);
  const year = Number(match[2]);
  return year * 10 + q;
}

function targetDateSortValue(targetDate: string): number {
  if (!targetDate.trim()) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = Date.parse(targetDate);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  const parts = targetDate.split(/[./-]/).map((item) => Number(item));
  if (parts.length !== 3 || parts.some((item) => !Number.isFinite(item))) {
    return Number.MAX_SAFE_INTEGER;
  }

  const yearFirst = parts[0] > 1900;
  const year = yearFirst ? parts[0] : parts[2];
  const month = parts[1] - 1;
  const day = yearFirst ? parts[2] : parts[0];
  return new Date(year, month, day).getTime();
}

function humanizeStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusClass(status: string): string {
  switch (status) {
    case "on_track":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "at_risk":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "not_started":
      return "bg-slate-200 text-slate-700 border-slate-300";
    case "completed":
      return "bg-sky-100 text-sky-800 border-sky-200";
    default:
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
  }
}

export function RoadmapWorkspace({
  initialItems,
  initialQuarterFilter = "all",
}: {
  initialItems: InitiativeRecord[];
  initialQuarterFilter?: string;
}) {
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<InitiativeRecord[]>(initialItems);
  const [statusFilter, setStatusFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState(initialQuarterFilter);
  const [searchText, setSearchText] = useState("");
  const [quarterSort, setQuarterSort] = useState<"asc" | "desc">("asc");
  const [dateSort, setDateSort] = useState<"asc" | "desc">("asc");
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  const quarters = useMemo(() => Array.from(new Set(items.map((item) => item.quarter))).sort(), [items]);
  const statuses = useMemo(() => Array.from(new Set(items.map((item) => item.status))).sort(), [items]);

  const filtered = useMemo(() => {
    const filteredItems = items.filter((item) => {
      if (quarterFilter !== "all" && item.quarter !== quarterFilter) {
        return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (searchText.trim()) {
        const bag = [item.title, item.epic, item.lead, item.detail, item.customer, item.roiMetric].join(" ").toLowerCase();
        if (!bag.includes(searchText.toLowerCase())) {
          return false;
        }
      }
      return true;
    });

    return [...filteredItems].sort((a, b) => {
      const quarterA = quarterSortValue(a.quarter);
      const quarterB = quarterSortValue(b.quarter);
      const aBacklog = quarterA >= Number.MAX_SAFE_INTEGER - 1;
      const bBacklog = quarterB >= Number.MAX_SAFE_INTEGER - 1;

      if (aBacklog !== bBacklog) {
        return aBacklog ? 1 : -1;
      }

      const quarterDiff = quarterA - quarterB;
      if (quarterDiff !== 0) {
        return quarterSort === "asc" ? quarterDiff : -quarterDiff;
      }

      const dateDiff = targetDateSortValue(a.targetDate) - targetDateSortValue(b.targetDate);
      if (dateDiff !== 0) {
        return dateSort === "asc" ? dateDiff : -dateDiff;
      }

      return a.id - b.id;
    });
  }, [items, quarterFilter, statusFilter, searchText, quarterSort, dateSort]);

  const groups = useMemo(() => {
    const m = new Map<string, InitiativeRecord[]>();
    for (const item of filtered) {
      const row = m.get(item.epic) ?? [];
      row.push(item);
      m.set(item.epic, row);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  async function reloadInitiatives() {
    const res = await fetch("/api/initiatives", { cache: "no-store" });
    const data = (await res.json()) as { items: InitiativeRecord[] };
    setItems(data.items);
  }

  async function addInitiative() {
    setCreating(true);
    try {
      const res = await fetch("/api/initiatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New initiative",
          epic: "New epic",
          quarter: "Backlog",
          status: "not_started",
          progress: 0,
        }),
      });
      const data = (await res.json()) as { item?: InitiativeRecord };
      if (data.item) {
        setItems((prev) => [...prev, data.item!]);
        router.push(`/initiatives/${data.item.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function syncFromExcel() {
    setSyncing(true);
    try {
      await fetch("/api/admin/reseed", { method: "POST" });
      await reloadInitiatives();
    } finally {
      setSyncing(false);
    }
  }

  async function importRoadmapExcel(file: File) {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import-roadmap", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        alert("Roadmap import failed.");
        return;
      }

      await reloadInitiatives();
      alert("Roadmap imported and refreshed.");
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="-mx-4 min-h-[calc(100vh-88px)] bg-[#f2f4f7] sm:-mx-6 lg:-mx-8">
      <div className="min-h-[calc(100vh-88px)]">
        <div className="border-r border-slate-300">
          <header className="border-b border-slate-300 bg-[#f7be00] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Maistro 2026 Product Strateji
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-900/30 bg-white px-3 py-2 text-sm"
                  onClick={addInitiative}
                  disabled={creating}
                >
                  {creating ? "Adding..." : "+ Add element"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-900/30 bg-white px-3 py-2 text-sm"
                  onClick={syncFromExcel}
                  disabled={syncing}
                >
                  {syncing ? "Syncing..." : "Resync Excel"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-900/30 bg-white px-3 py-2 text-sm"
                  onClick={() => importInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? "Importing..." : "Roadmap Import"}
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void importRoadmapExcel(file);
                    }
                  }}
                />
              </div>
            </div>
          </header>

          <div className="border-b border-slate-300 bg-white px-4 py-3">
            <div className="grid gap-3 md:grid-cols-6">
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search..."
                className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
              <select
                value={quarterFilter}
                onChange={(event) => setQuarterFilter(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All quarters</option>
                {quarters.map((quarter) => (
                  <option key={quarter} value={quarter}>
                    {quarter}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {humanizeStatus(status)}
                  </option>
                ))}
              </select>
              <select
                value={quarterSort}
                onChange={(event) => setQuarterSort(event.target.value as "asc" | "desc")}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="asc">Quarter: Q1 - Q4</option>
                <option value="desc">Quarter: Q4 - Q1</option>
              </select>
              <select
                value={dateSort}
                onChange={(event) => setDateSort(event.target.value as "asc" | "desc")}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="asc">Date: Near - Far</option>
                <option value="desc">Date: Far - Near</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1220px] w-full border-collapse text-sm">
              <thead className="bg-[#f8f9fb]">
                <tr className="border-b border-slate-300">
                  <th className="w-14 px-3 py-2 text-left font-semibold">#</th>
                  <th className="w-[280px] px-3 py-2 text-left font-semibold">Initiative</th>
                  <th className="w-[120px] px-3 py-2 text-left font-semibold">Quarter</th>
                  <th className="w-[140px] px-3 py-2 text-left font-semibold">Status</th>
                  <th className="w-[110px] px-3 py-2 text-left font-semibold">% complete</th>
                  <th className="w-[150px] px-3 py-2 text-left font-semibold">Lead</th>
                  <th className="w-[150px] px-3 py-2 text-left font-semibold">Customer</th>
                  <th className="w-[150px] px-3 py-2 text-left font-semibold">ROI</th>
                  <th className="px-3 py-2 text-left font-semibold">Notes</th>
                  <th className="w-[130px] px-3 py-2 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(([epic, rows]) => (
                  <FragmentGroup key={epic} epic={epic} rows={rows} />
                ))}
                {groups.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-500" colSpan={10}>
                      No initiatives found for filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <FloatingChatLauncher />
    </div>
  );
}

function FragmentGroup({ epic, rows }: { epic: string; rows: InitiativeRecord[] }) {
  return (
    <>
      <tr className="border-y border-slate-300 bg-[#ebedf2]">
        <td className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-600" colSpan={10}>
          {epic} ({rows.length})
        </td>
      </tr>
      {rows.map((item) => (
        <tr key={item.id} className="border-b border-slate-200 bg-white align-middle hover:bg-slate-50">
          <td className="px-3 py-3 text-slate-500">{item.id}</td>
          <td className="px-3 py-3">
            <p className="font-medium text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">{item.targetDate || "No target date"}</p>
          </td>
          <td className="px-3 py-3">
            <span className="inline-flex whitespace-nowrap rounded-full border border-violet-200 bg-violet-100 px-2.5 py-0.5 text-xs text-violet-800">
              {item.quarter}
            </span>
          </td>
          <td className="px-3 py-3">
            <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs leading-none ${statusClass(item.status)}`}>
              {humanizeStatus(item.status)}
            </span>
          </td>
          <td className="px-3 py-3 text-slate-800">{item.progress}%</td>
          <td className="px-3 py-3 text-slate-700">{item.lead}</td>
          <td className="px-3 py-3">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
              {item.customer || "Unassigned"}
            </span>
          </td>
          <td className="px-3 py-3 text-slate-700">{item.roiMetric || item.roiValue || "-"}</td>
          <td className="px-3 py-3">
            <ul className="list-disc space-y-1 pl-4 text-slate-700">
              {item.notes.slice(0, 2).map((note) => (
                <li key={`${item.id}-${note}`}>{note}</li>
              ))}
            </ul>
          </td>
          <td className="px-3 py-3">
            <Link
              href={`/initiatives/${item.id}`}
              className="inline-flex min-w-[84px] items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-slate-200"
            >
              View detail
            </Link>
          </td>
        </tr>
      ))}
    </>
  );
}
