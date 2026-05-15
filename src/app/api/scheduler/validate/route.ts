import { NextResponse } from "next/server";
import { validateMove } from "@/lib/scheduler";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER"]);
    const body = await request.json();
    const { day, campusId, entryId } = body;
    // Accept blockIndex (1..7) or legacy `slot` (0..6) for back-compat.
    const blockIndex = typeof body.blockIndex === "number" ? body.blockIndex : (typeof body.slot === "number" ? body.slot + 1 : NaN);
    requireCampusAccess(user, campusId);
    return NextResponse.json(validateMove(day, blockIndex, campusId, entryId));
  } catch (error) {
    return jsonError(error);
  }
}
