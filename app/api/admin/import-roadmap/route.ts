import { NextRequest, NextResponse } from "next/server";
import { reseedDbFromExcel, saveRoadmapExcelFromUpload } from "@/lib/backlog-db";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Excel file is required." }, { status: 400 });
  }

  const filename = file.name.toLowerCase();
  if (!filename.endsWith(".xlsx")) {
    return NextResponse.json({ message: "Only .xlsx files are supported." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  await saveRoadmapExcelFromUpload(Buffer.from(bytes));
  const db = await reseedDbFromExcel();

  return NextResponse.json({ ok: true, total: db.initiatives.length });
}
