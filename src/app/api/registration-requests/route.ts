import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationRequests } from "@/lib/demo-data";
import { getScopedCampusIds, jsonError, requireAuth } from "@/lib/access-control";

export async function GET() {
  try {
    const user = await requireAuth();
    const scopedCampusIds = getScopedCampusIds(user);
    const requests = await prisma.registrationRequest.findMany({
      where: user.role === "SUPERADMIN" ? undefined : { campusId: { in: scopedCampusIds } },
      include: { campus: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(requests);
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    const user = await requireAuth().catch(() => null);
    if (!user) return jsonError(error);
    const scopedCampusIds = getScopedCampusIds(user);
    return NextResponse.json(user.role === "SUPERADMIN" ? registrationRequests : registrationRequests.filter((request) => scopedCampusIds.includes(request.campusId)));
  }
}
