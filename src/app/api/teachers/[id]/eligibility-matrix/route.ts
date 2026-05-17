import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { getTeacherEligibilityMatrix, saveTeacherEligibilityMatrix } from "@/server/repositories/teachers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    return NextResponse.json(getTeacherEligibilityMatrix(id));
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  campusId: z.string(),
  cells: z.array(z.object({ subject_id: z.string(), course_id: z.string() }))
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const { id } = await params;
    const body = schema.parse(await request.json());
    requireCampusAccess(user, body.campusId);
    saveTeacherEligibilityMatrix(id, body.cells);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
