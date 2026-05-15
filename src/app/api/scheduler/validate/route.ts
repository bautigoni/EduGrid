import { NextResponse } from "next/server";
import { validateMove } from "@/lib/scheduler";

export async function POST(request: Request) {
  const { day, slot } = await request.json();
  return NextResponse.json(validateMove(day, slot));
}
