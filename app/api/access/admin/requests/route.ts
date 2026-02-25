import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/backlog-db";

function isAuthorized(key: string): boolean {
  const adminKey = process.env.ACCESS_ADMIN_KEY ?? "";
  return Boolean(adminKey) && key === adminKey;
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key") ?? "";
  if (!isAuthorized(key)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const db = await readDb();
  const items = [...db.accessRequests].sort((a, b) => b.id - a.id);
  return NextResponse.json({ items });
}

