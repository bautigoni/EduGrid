import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ requestId: z.string() });

export async function POST(request: Request) {
  const { requestId } = schema.parse(await request.json());

  try {
    const registration = await prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        user: { update: { status: "REJECTED" } }
      }
    });
    return NextResponse.json(registration);
  } catch {
    return NextResponse.json({ ok: true, source: "mock", requestId });
  }
}
