import { NextResponse } from "next/server";
import { parseCsvPreview } from "@/lib/imports";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER"]);
    const formData = await request.formData();
    const campusId = String(formData.get("campusId") ?? getDefaultCampusId(user) ?? "");
    requireCampusAccess(user, campusId);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const content = await file.text();
    return NextResponse.json({
      filename: file.name,
      type: formData.get("type"),
      campusId,
      preview: parseCsvPreview(content),
      mapping: {},
      validationStatus: "READY_FOR_MAPPING"
    });
  } catch (error) {
    return jsonError(error);
  }
}
