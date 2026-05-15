import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { classrooms } from "@/lib/demo-data";

const classroomSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["REGULAR", "LABORATORY", "COMPUTER_ROOM", "SPECIAL"]),
  capacity: z.number().int().min(1).max(200),
  restrictions: z.string().optional()
});

export async function GET() {
  try {
    return NextResponse.json(await prisma.classroom.findMany({ orderBy: { name: "asc" } }));
  } catch {
    return NextResponse.json(classrooms);
  }
}

export async function POST(request: Request) {
  const payload = classroomSchema.parse(await request.json());
  const classroom = await prisma.classroom.create({ data: payload });
  return NextResponse.json(classroom, { status: 201 });
}
