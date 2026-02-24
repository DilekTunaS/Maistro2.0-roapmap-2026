import { NextRequest, NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/backlog-db";

function toStringArray(input: unknown): string[] {
  return Array.isArray(input) ? input.map((item) => String(item).trim()).filter(Boolean) : [];
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = await readDb();
  const id = Number(params.id);
  const item = db.initiatives.find((row) => row.id === id);
  if (!item) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await request.json();

  const next = await updateDb((db) => {
    const initiatives = db.initiatives.map((item) => {
      if (item.id !== id) {
        return item;
      }

      return {
        ...item,
        epic: body.epic !== undefined ? String(body.epic) : item.epic,
        title: body.title !== undefined ? String(body.title) : item.title,
        detail: body.detail !== undefined ? String(body.detail) : item.detail,
        quarter: body.quarter !== undefined ? String(body.quarter) : item.quarter,
        targetDate: body.targetDate !== undefined ? String(body.targetDate) : item.targetDate,
        status: body.status !== undefined ? body.status : item.status,
        progress: body.progress !== undefined ? Number(body.progress) : item.progress,
        lead: body.lead !== undefined ? String(body.lead) : item.lead,
        customer: body.customer !== undefined ? String(body.customer) : item.customer,
        constraints: body.constraints !== undefined ? String(body.constraints) : item.constraints,
        completionCriteria:
          body.completionCriteria !== undefined ? String(body.completionCriteria) : item.completionCriteria,
        solution: body.solution !== undefined ? String(body.solution) : item.solution,
        expectation: body.expectation !== undefined ? String(body.expectation) : item.expectation,
        roiMetric: body.roiMetric !== undefined ? String(body.roiMetric) : item.roiMetric,
        roiValue: body.roiValue !== undefined ? String(body.roiValue) : item.roiValue,
        storyPoint: body.storyPoint !== undefined
          ? body.storyPoint === null || body.storyPoint === ""
            ? null
            : Number(body.storyPoint)
          : item.storyPoint,
        notes: body.notes !== undefined ? toStringArray(body.notes) : item.notes,
        demoLinks: body.demoLinks !== undefined ? toStringArray(body.demoLinks) : item.demoLinks,
        docLinks: body.docLinks !== undefined ? toStringArray(body.docLinks) : item.docLinks,
        updatedAt: new Date().toISOString(),
      };
    });

    return { ...db, initiatives };
  });

  const updated = next.initiatives.find((item) => item.id === id);
  if (!updated) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: updated });
}
