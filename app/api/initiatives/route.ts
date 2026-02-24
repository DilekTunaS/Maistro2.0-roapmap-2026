import { NextRequest, NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/backlog-db";
import { InitiativeRecord } from "@/lib/types";

function sortById(items: InitiativeRecord[]): InitiativeRecord[] {
  return [...items].sort((a, b) => a.id - b.id);
}

export async function GET(request: NextRequest) {
  const db = await readDb();
  const search = request.nextUrl.searchParams;
  const quarter = search.get("quarter");
  const status = search.get("status");
  const q = search.get("q")?.toLowerCase().trim();

  let rows = db.initiatives;
  if (quarter && quarter !== "all") {
    rows = rows.filter((item) => item.quarter === quarter);
  }
  if (status && status !== "all") {
    rows = rows.filter((item) => item.status === status);
  }
  if (q) {
    rows = rows.filter((item) =>
      [item.title, item.epic, item.detail, item.solution, item.lead, item.customer, item.roiMetric]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  return NextResponse.json({ items: sortById(rows) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const now = new Date().toISOString();
  const created = await updateDb((db) => {
    const nextId = db.initiatives.reduce((max, item) => Math.max(max, item.id), 0) + 1;

    const item: InitiativeRecord = {
      id: nextId,
      epic: String(body.epic ?? "Uncategorized"),
      title: String(body.title ?? "New initiative"),
      detail: String(body.detail ?? ""),
      quarter: String(body.quarter ?? "Backlog"),
      targetDate: String(body.targetDate ?? ""),
      status: (body.status ?? "not_started") as InitiativeRecord["status"],
      progress: Number(body.progress ?? 0),
      lead: String(body.lead ?? "Unassigned"),
      customer: String(body.customer ?? "Unassigned"),
      constraints: String(body.constraints ?? ""),
      completionCriteria: String(body.completionCriteria ?? ""),
      solution: String(body.solution ?? ""),
      expectation: String(body.expectation ?? ""),
      roiMetric: String(body.roiMetric ?? ""),
      roiValue: String(body.roiValue ?? ""),
      storyPoint: body.storyPoint === null || body.storyPoint === undefined ? null : Number(body.storyPoint),
      notes: Array.isArray(body.notes) ? body.notes.map((x: unknown) => String(x)) : [],
      demoLinks: Array.isArray(body.demoLinks) ? body.demoLinks.map((x: unknown) => String(x)) : [],
      docLinks: Array.isArray(body.docLinks) ? body.docLinks.map((x: unknown) => String(x)) : [],
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...db,
      initiatives: [...db.initiatives, item],
    };
  });

  return NextResponse.json({ ok: true, item: created.initiatives[created.initiatives.length - 1] });
}
