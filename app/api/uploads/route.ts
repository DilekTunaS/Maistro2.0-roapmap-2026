import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const now = Date.now();
  const filename = `${now}-${safeName(file.name || "upload.bin")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const fullPath = path.join(uploadDir, filename);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(fullPath, buffer);

  return NextResponse.json({
    ok: true,
    url: `/uploads/${filename}`,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
