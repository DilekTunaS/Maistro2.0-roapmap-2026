import { NextResponse } from "next/server";
import { reseedDbFromExcel } from "@/lib/backlog-db";

export async function POST() {
  const db = await reseedDbFromExcel();
  return NextResponse.json({ ok: true, total: db.initiatives.length });
}