import { NextResponse } from "next/server";
import { jsonError, requireAuth, requireRole } from "@/lib/access-control";

// Registration now flows through invitation codes. Pending requests only exist
// when an invitation code is flagged with requires_approval = 1 (not yet
// surfaced here). Returning an empty list keeps the existing UI working.
export async function GET() {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    return NextResponse.json([]);
  } catch (error) {
    return jsonError(error);
  }
}
