import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { classrooms } from "@/lib/demo-data";
import { jsonError, requireAuth, requireCampusAccess, requireRole, resolveCampusScope } from "@/lib/access-control";

const classroomSchema = z.object({
  campusId: z.string().default("campus-nordelta"),
  name: z.string().min(1),
  type: z.enum(["REGULAR", "LABORATORY", "COMPUTER_ROOM", "SPECIAL"]),
  capacity: z.number().int().min(1).max(200),
  restrictions: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusIds = resolveCampusScope(user, new URL(request.url).searchParams.get("campusId"));
    return NextResponse.json(await prisma.classroom.findMany({ where: { campusId: { in: campusIds } }, orderBy: { name: "asc" } }));
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    const user = await requireAuth().catch(() => null);
    if (!user) return jsonError(error);
    const campusIds = resolveCampusScope(user, new URL(request.url).searchParams.get("campusId"));
    return NextResponse.json(classrooms.filter((room) => campusIds.includes(room.campusId)));
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER"]);
    const payload = classroomSchema.parse(await request.json());
    requireCampusAccess(user, payload.campusId);
    const classroom = await prisma.classroom.create({ data: payload });
    return NextResponse.json(classroom, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
