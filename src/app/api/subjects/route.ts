import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subjects } from "@/lib/demo-data";

export async function GET() {
  try {
    return NextResponse.json(await prisma.subject.findMany({ orderBy: { name: "asc" } }));
  } catch {
    return NextResponse.json(subjects);
  }
}
