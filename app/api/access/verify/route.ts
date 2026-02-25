import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/lib/access";
import { readDb } from "@/lib/backlog-db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ message: "Kod gerekli." }, { status: 400 });
  }

  const db = await readDb();
  const valid = db.accessCodes.find((item) => item.code === code && item.active);
  if (!valid) {
    return NextResponse.json({ message: "Kod gecersiz ya da pasif." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, message: "Erisim verildi." });
  response.cookies.set(ACCESS_COOKIE_NAME, "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

