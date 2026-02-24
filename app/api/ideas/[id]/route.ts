import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/backlog-db";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await request.json();

  const next = await updateDb((db) => {
    const ideas = db.ideas.map((idea) => {
      if (idea.id !== id) {
        return idea;
      }

      return {
        ...idea,
        title: body.title !== undefined ? String(body.title) : idea.title,
        description: body.description !== undefined ? String(body.description) : idea.description,
        category: body.category !== undefined ? String(body.category) : idea.category,
        pinned: body.pinned !== undefined ? Boolean(body.pinned) : idea.pinned,
        votes: body.votes !== undefined ? Number(body.votes) : idea.votes,
      };
    });

    return { ...db, ideas };
  });

  const item = next.ideas.find((idea) => idea.id === id);
  if (!item) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  const next = await updateDb((db) => ({
    ...db,
    ideas: db.ideas.filter((idea) => idea.id !== id),
  }));

  return NextResponse.json({ ok: true, total: next.ideas.length });
}
