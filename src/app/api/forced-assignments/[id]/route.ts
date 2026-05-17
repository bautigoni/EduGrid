import { NextResponse } from "next/server";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { deleteForcedAssignment, getForcedAssignmentById } from "@/server/repositories/forcedAssignments";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const campusId = new URL(request.url).searchParams.get("campusId");
    if (!campusId) return NextResponse.json({ message: "campusId requerido" }, { status: 400 });
    requireCampusAccess(user, campusId);
    const { id } = await params;
    if (!getForcedAssignmentById(id, campusId)) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    deleteForcedAssignment(id, campusId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
