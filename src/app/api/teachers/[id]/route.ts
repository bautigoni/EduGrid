import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { archiveTeacher, getTeacherById, updateTeacher } from "@/server/repositories/teachers";

const patchSchema = z.object({
  campusId: z.string().min(1),
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  contractual_weekly_minutes: z.number().int().min(0).max(60 * 60).optional(),
  allow_institutional_hours: z.boolean().optional(),
  notes: z.string().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    requireCampusAccess(user, body.campusId);
    const { campusId, ...rest } = body;
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v === "" && k === "email") data[k] = null;
      else if (v !== undefined) data[k] = v;
    }
    if (typeof data.allow_institutional_hours === "boolean") {
      data.allow_institutional_hours = data.allow_institutional_hours ? 1 : 0;
    }
    const teacher = updateTeacher(id, campusId, data as never);
    if (!teacher) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    return NextResponse.json(teacher);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const url = new URL(request.url);
    const campusId = url.searchParams.get("campusId");
    if (!campusId) return NextResponse.json({ message: "campusId requerido" }, { status: 400 });
    requireCampusAccess(user, campusId);
    const { id } = await params;
    if (!getTeacherById(id, campusId)) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    archiveTeacher(id, campusId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
