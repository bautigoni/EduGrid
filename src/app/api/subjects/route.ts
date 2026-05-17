import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { createSubject, getSubjectsByCampus } from "@/server/repositories/subjects";

const schema = z.object({
  campusId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusId = new URL(request.url).searchParams.get("campusId");
    if (!campusId) return NextResponse.json([]);
    requireCampusAccess(user, campusId);
    return NextResponse.json(getSubjectsByCampus(campusId));
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
    return NextResponse.json(createSubject(data.campusId, data), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
