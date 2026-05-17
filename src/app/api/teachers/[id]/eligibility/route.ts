import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { getTeacherCourseEligibility, saveTeacherCourseEligibility } from "@/server/repositories/teachers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    return NextResponse.json(getTeacherCourseEligibility(id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const { id } = await params;
    const body = z.object({ campusId: z.string(), courseIds: z.array(z.string()) }).parse(await request.json());
    requireCampusAccess(user, body.campusId);
    saveTeacherCourseEligibility(id, body.courseIds);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
