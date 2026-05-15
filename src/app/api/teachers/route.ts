import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { teachers } from "@/lib/demo-data";
import { jsonError, requireAuth, requireCampusAccess, requireRole, resolveCampusScope } from "@/lib/access-control";

const teacherSchema = z.object({
  campusId: z.string().default("campus-nordelta"),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  contractualHours: z.number().int().min(1).max(40),
  allowInstitutionalHours: z.boolean().optional().default(true),
  preferences: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusId = new URL(request.url).searchParams.get("campusId");
    const campusIds = resolveCampusScope(user, campusId);
    const data = await prisma.teacher.findMany({
      where: { campusId: { in: campusIds } },
      include: { subjects: { include: { subject: true } }, blockedSlots: true },
      orderBy: { fullName: "asc" }
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    const user = await requireAuth().catch(() => null);
    if (!user) return jsonError(error);
    const campusIds = resolveCampusScope(user, new URL(request.url).searchParams.get("campusId"));
    return NextResponse.json(teachers.filter((teacher) => campusIds.includes(teacher.campusId)));
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER"]);
    const payload = teacherSchema.parse(await request.json());
    requireCampusAccess(user, payload.campusId);
    const teacher = await prisma.teacher.create({ data: payload });
    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
