import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { createCourse, getCoursesByCampus } from "@/server/repositories/courses";

const schema = z.object({
  campusId: z.string().min(1),
  name: z.string().min(1),
  year: z.number().int().min(1).max(12).optional(),
  division: z.string().min(1).max(8).optional(),
  default_classroom_label: z.string().optional(),
  student_count: z.number().int().min(0).max(200).optional()
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusId = new URL(request.url).searchParams.get("campusId");
    if (!campusId) return NextResponse.json([]);
    requireCampusAccess(user, campusId);
    return NextResponse.json(getCoursesByCampus(campusId));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const data = schema.parse(await request.json());
    requireCampusAccess(user, data.campusId);
    const course = createCourse(data.campusId, {
      name: data.name,
      year: data.year,
      division: data.division,
      default_classroom_label: data.default_classroom_label,
      student_count: data.student_count
    });
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
