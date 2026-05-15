import { NextResponse } from "next/server";
import { parseCsvPreview } from "@/lib/imports";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  const content = await file.text();
  return NextResponse.json({
    filename: file.name,
    type: formData.get("type"),
    preview: parseCsvPreview(content),
    mapping: {},
    validationStatus: "READY_FOR_MAPPING"
  });
}
