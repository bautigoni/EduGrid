import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { courses } from "@/lib/demo-data";
import { jsonError, requireAuth, requireCampusAccess, requireRole, resolveCampusScope } from "@/lib/access-control";

const courseSchema = z.object({
  campusId: z.string().default("campus-nordelta"),
  year: z.number().int().min(1).max(12),
  division: z.string().min(1).max(8),
  label: z.string().min(1),
  studentCount: z.number().int().min(1).max(60)
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusIds = resolveCampusScope(user, new URL(request.url).searchParams.get("campusId"));
    const data = await prisma.course.findMany({ where: { campusId: { in: campusIds } }, include: { subjects: { include: { subject: true } } } });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    const user = await requireAuth().catch(() => null);
    if (!user) return jsonError(error);
    const campusIds = resolveCampusScope(user, new URL(request.url).searchParams.get("campusId"));
    return NextResponse.json(courses.filter((course) => campusIds.includes(course.campusId)));
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER"]);
    const payload = courseSchema.parse(await request.json());
    requireCampusAccess(user, payload.campusId);
    const course = await prisma.course.create({ data: payload });
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
