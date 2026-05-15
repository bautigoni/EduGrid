import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subjects } from "@/lib/demo-data";
import { jsonError, requireAuth, resolveCampusScope } from "@/lib/access-control";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusIds = resolveCampusScope(user, new URL(request.url).searchParams.get("campusId"));
    return NextResponse.json(await prisma.subject.findMany({ where: { OR: [{ campusId: null }, { campusId: { in: campusIds } }] }, orderBy: { name: "asc" } }));
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    const user = await requireAuth().catch(() => null);
    if (!user) return jsonError(error);
    const campusIds = resolveCampusScope(user, new URL(request.url).searchParams.get("campusId"));
    return NextResponse.json(subjects.filter((subject) => subject.campusId === null || campusIds.includes(subject.campusId)));
  }
}
