import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/access";
import { updateDb } from "@/lib/backlog-db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const email = normalizeEmail(String(body.email ?? ""));
  const reason = String(body.reason ?? "").trim();

  if (!name || !email) {
    return NextResponse.json({ message: "Ad ve e-posta zorunlu." }, { status: 400 });
  }

  await updateDb((db) => {
    const now = new Date().toISOString();
    const existing = db.accessRequests.find((item) => normalizeEmail(item.email) === email && item.status === "pending");
    if (existing) {
      return db;
    }
    const nextId = db.accessRequests.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    return {
      ...db,
      accessRequests: [
        ...db.accessRequests,
        {
          id: nextId,
          name,
          email,
          reason,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
  });

  return NextResponse.json({ ok: true, message: "Talebin alindi. Onay sonrasi kod paylasilir." });
}

