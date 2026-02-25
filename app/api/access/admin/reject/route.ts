import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/backlog-db";

function isAuthorized(key: string): boolean {
  const adminKey = process.env.ACCESS_ADMIN_KEY ?? "";
  return Boolean(adminKey) && key === adminKey;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = Number(body.id);
  const key = String(body.key ?? "");

  if (!isAuthorized(key)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "Invalid request id." }, { status: 400 });
  }

  await updateDb((db) => {
    const now = new Date().toISOString();
    const requestItem = db.accessRequests.find((item) => item.id === id);
    if (!requestItem) {
      return db;
    }
    return {
      ...db,
      accessRequests: db.accessRequests.map((item) =>
        item.id === id ? { ...item, status: "rejected" as const, updatedAt: now } : item,
      ),
      accessCodes: db.accessCodes.map((item) =>
        item.email === requestItem.email ? { ...item, active: false } : item,
      ),
    };
  });

  return NextResponse.json({ ok: true, message: "Talep reddedildi." });
}

