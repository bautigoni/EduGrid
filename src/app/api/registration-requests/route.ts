import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationRequests } from "@/lib/demo-data";

export async function GET() {
  try {
    const requests = await prisma.registrationRequest.findMany({
      include: { campus: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(requests);
  } catch {
    return NextResponse.json(registrationRequests);
  }
}
