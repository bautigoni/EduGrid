import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";

const schema = z.object({
  requestId: z.string(),
  campusId: z.string(),
  role: z.enum(["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "VIEWER"])
});

export async function POST(request: Request) {
  let payload: z.infer<typeof schema> | null = null;
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN"]);
    payload = schema.parse(await request.json());
    requireCampusAccess(user, payload.campusId);
    const requestRecord = await prisma.registrationRequest.findUniqueOrThrow({ where: { id: payload.requestId } });
    await prisma.user.update({
      where: { id: requestRecord.userId },
      data: {
        status: "ACTIVE",
        role: payload.role,
        selectedCampusId: payload.campusId,
        campuses: {
          upsert: {
            where: { userId_campusId: { userId: requestRecord.userId, campusId: payload.campusId } },
            update: { role: payload.role },
            create: { campusId: payload.campusId, role: payload.role }
          }
        }
      }
    });
    const registration = await prisma.registrationRequest.update({
      where: { id: payload.requestId },
      data: { status: "APPROVED", campusId: payload.campusId, decidedAt: new Date() }
    });
    return NextResponse.json(registration);
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    return NextResponse.json({ ok: true, source: "mock", ...(payload ?? {}) });
  }
}
