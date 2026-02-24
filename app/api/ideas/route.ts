import { NextRequest, NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/backlog-db";
import { IdeaRecord } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  const ideas = [...db.ideas].sort((a, b) => b.votes - a.votes);
  return NextResponse.json({ items: ideas });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const now = new Date().toISOString();

  const next = await updateDb((db) => {
    const nextId = db.ideas.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const idea: IdeaRecord = {
      id: nextId,
      title: String(body.title ?? "Untitled idea"),
      description: String(body.description ?? ""),
      category: String(body.category ?? "General"),
      votes: 0,
      pinned: Boolean(body.pinned ?? false),
      createdAt: now,
    };

    return {
      ...db,
      ideas: [...db.ideas, idea],
    };
  });

  return NextResponse.json({ ok: true, item: next.ideas[next.ideas.length - 1] });
}