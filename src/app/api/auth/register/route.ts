import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  institutionName: z.string().min(2),
  requestedCampus: z.string().min(2),
  requestedRole: z.enum(["CAMPUS_ADMIN", "SCHEDULER", "VIEWER"]).default("VIEWER"),
  message: z.string().optional()
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());

  try {
    const campus = await prisma.campus.findFirst({
      where: {
        OR: [
          { name: { equals: payload.requestedCampus, mode: "insensitive" } },
          { code: { equals: payload.requestedCampus, mode: "insensitive" } }
        ]
      }
    });

    const user = await prisma.user.create({
      data: {
        name: payload.fullName,
        email: payload.email,
        passwordHash: await bcrypt.hash(payload.password, 12),
        role: payload.requestedRole,
        status: "PENDING_APPROVAL",
        selectedCampusId: campus?.id,
        registrationRequest: {
          create: {
            fullName: payload.fullName,
            email: payload.email,
            institutionName: payload.institutionName,
            requestedCampus: payload.requestedCampus,
            campusId: campus?.id,
            requestedRole: payload.requestedRole,
            message: payload.message
          }
        }
      }
    });

    return NextResponse.json({ id: user.id, status: "PENDING_APPROVAL" }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ message: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json(
      {
        id: "demo-registration",
        status: "PENDING_APPROVAL",
        source: "mock",
        message: "Registration captured in mock mode because the database is not available."
      },
      { status: 201 }
    );
  }
}
