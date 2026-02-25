import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/backlog-db";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  let delta = 1;

  try {
    const body = await request.json();
    if (typeof body?.delta === "number" && Number.isFinite(body.delta)) {
      delta = Math.sign(body.delta) || 1;
    }
  } catch {
    // default delta = +1 for backward compatibility
  }

  const next = await updateDb((db) => {
    const ideas = db.ideas.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        votes: Math.max(0, item.votes + delta),
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
