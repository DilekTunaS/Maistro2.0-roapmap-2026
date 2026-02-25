import { NextRequest, NextResponse } from "next/server";
import { generateAccessCode } from "@/lib/access";
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

  const code = generateAccessCode();
  const next = await updateDb((db) => {
    const now = new Date().toISOString();
    const requestItem = db.accessRequests.find((item) => item.id === id);
    if (!requestItem) {
      return db;
    }

    const updatedRequests = db.accessRequests.map((item) =>
      item.id === id
        ? { ...item, status: "approved" as const, updatedAt: now, approvedCode: code }
        : item,
    );

    return {
      ...db,
      accessRequests: updatedRequests,
      accessCodes: [
        ...db.accessCodes.filter((item) => item.email !== requestItem.email),
        {
          code,
          email: requestItem.email,
          active: true,
          createdAt: now,
          createdBy: "admin",
        },
      ],
    };
  });

  const approved = next.accessRequests.find((item) => item.id === id);
  return NextResponse.json({
    ok: true,
    message: approved?.approvedCode
      ? `Onaylandi. Kod: ${approved.approvedCode}`
      : "Onaylandi.",
  });
}

