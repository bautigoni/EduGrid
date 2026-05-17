import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { archiveSubject, getSubjectById, updateSubject } from "@/server/repositories/subjects";

const patchSchema = z.object({
  campusId: z.string().min(1),
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  color: z.string().optional(),
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
    const updated = updateSubject(id, campusId, rest);
    if (!updated) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const campusId = new URL(request.url).searchParams.get("campusId");
    if (!campusId) return NextResponse.json({ message: "campusId requerido" }, { status: 400 });
    requireCampusAccess(user, campusId);
    const { id } = await params;
    if (!getSubjectById(id, campusId)) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    archiveSubject(id, campusId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
