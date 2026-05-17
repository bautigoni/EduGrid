import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { createTeacher, getTeachersByCampus } from "@/server/repositories/teachers";

const teacherSchema = z.object({
  campusId: z.string().min(1),
  full_name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  contractual_weekly_minutes: z.number().int().min(0).max(60 * 60).default(0),
  allow_institutional_hours: z.boolean().optional(),
  notes: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const campusId = url.searchParams.get("campusId");
    if (!campusId) return NextResponse.json([], { status: 200 });
    requireCampusAccess(user, campusId);
    return NextResponse.json(getTeachersByCampus(campusId));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const payload = teacherSchema.parse(await request.json());
    requireCampusAccess(user, payload.campusId);
    const teacher = createTeacher(payload.campusId, {
      full_name: payload.full_name,
      email: payload.email || undefined,
      contractual_weekly_minutes: payload.contractual_weekly_minutes,
      allow_institutional_hours: payload.allow_institutional_hours,
      notes: payload.notes
    });
    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
