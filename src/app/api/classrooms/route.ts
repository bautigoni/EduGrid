import { NextResponse } from "next/server";
import { jsonError, requireAuth } from "@/lib/access-control";

// Classrooms are not a first-class entity anymore: each course carries its own
// default classroom label. Kept as a stub so legacy imports do not break.
export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json([]);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST() {
  return NextResponse.json({ message: "Las aulas se gestionan dentro de cada curso." }, { status: 410 });
}
