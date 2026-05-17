import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { getCourseSubjectRequirements, saveCourseSubjectRequirements } from "@/server/repositories/courses";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    return NextResponse.json(getCourseSubjectRequirements(id));
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  campusId: z.string(),
  requirements: z.array(
    z.object({
      subject_id: z.string(),
      weekly_blocks_required: z.number().int().min(0).max(40),
      weekly_minutes_required: z.number().int().min(0).optional()
    })
  )
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const { id } = await params;
    const body = schema.parse(await request.json());
    requireCampusAccess(user, body.campusId);
    saveCourseSubjectRequirements(body.campusId, id, body.requirements);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
