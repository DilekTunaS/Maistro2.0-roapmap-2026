import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/backlog-db";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  const next = await updateDb((db) => {
    const ideas = db.ideas.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        votes: item.votes + 1,
      };
    });

    return {
      ...db,
      ideas,
    };
  });

  const idea = next.ideas.find((item) => item.id === id);
  if (!idea) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: idea });
}