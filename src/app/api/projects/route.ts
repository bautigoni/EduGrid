import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { createProject, getProjectsByCampus } from "@/server/repositories/projects";

const schema = z.object({
  campusId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["PROJECT", "ELECTIVE", "OPTATIVE", "WORKSHOP", "CITIZENSHIP", "INTERDISCIPLINARY"]),
  description: z.string().optional(),
  fixed_time_block_id: z.string().nullable().optional(),
  weekly_blocks_required: z.number().int().min(1).max(20).optional(),
  flexible: z.boolean().optional(),
  notes: z.string().optional(),
  teacher_ids: z.array(z.string()).optional(),
  course_ids: z.array(z.string()).optional()
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusId = new URL(request.url).searchParams.get("campusId");
    if (!campusId) return NextResponse.json([]);
    requireCampusAccess(user, campusId);
    return NextResponse.json(getProjectsByCampus(campusId));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const body = schema.parse(await request.json());
    requireCampusAccess(user, body.campusId);
    const { campusId, ...data } = body;
    return NextResponse.json(createProject(campusId, data), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
