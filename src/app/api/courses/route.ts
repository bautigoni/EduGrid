import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { courses } from "@/lib/demo-data";

const courseSchema = z.object({
  year: z.number().int().min(1).max(12),
  division: z.string().min(1).max(8),
  label: z.string().min(1),
  studentCount: z.number().int().min(1).max(60)
});

export async function GET() {
  try {
    const data = await prisma.course.findMany({ include: { subjects: { include: { subject: true } } } });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(courses);
  }
}

export async function POST(request: Request) {
  const payload = courseSchema.parse(await request.json());
  const course = await prisma.course.create({ data: payload });
  return NextResponse.json(course, { status: 201 });
}
