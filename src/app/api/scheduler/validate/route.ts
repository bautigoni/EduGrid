import { NextResponse } from "next/server";
import { jsonError, requireAuth } from "@/lib/access-control";

export async function POST(_request: Request) {
  try {
    await requireAuth();
    // Manual drag-and-drop validation is deferred until the new scheduling
    // engine exposes per-cell rules from SQLite.
    return NextResponse.json({ valid: true, conflicts: [], suggestions: [] });
  } catch (error) {
    return jsonError(error);
  }
}
