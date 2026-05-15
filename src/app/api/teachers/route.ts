import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { teachers } from "@/lib/demo-data";

const teacherSchema = z.object({
  campusId: z.string().default("campus-nordelta"),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  weeklyMaxModules: z.number().int().min(1).max(40),
  preferences: z.string().optional()
});

export async function GET() {
  try {
    const data = await prisma.teacher.findMany({
      include: { subjects: { include: { subject: true } }, blockedSlots: true },
      orderBy: { fullName: "asc" }
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(teachers);
  }
}

export async function POST(request: Request) {
  const payload = teacherSchema.parse(await request.json());
  const teacher = await prisma.teacher.create({ data: payload });
  return NextResponse.json(teacher, { status: 201 });
}
