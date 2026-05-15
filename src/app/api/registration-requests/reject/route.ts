import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireAuth, requireRole } from "@/lib/access-control";

const schema = z.object({ requestId: z.string() });

export async function POST(request: Request) {
  let requestId = "unknown";
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN"]);
    requestId = schema.parse(await request.json()).requestId;
    const registration = await prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        user: { update: { status: "REJECTED" } }
      }
    });
    return NextResponse.json(registration);
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    return NextResponse.json({ ok: true, source: "mock", requestId });
  }
}
