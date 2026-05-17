import { NextResponse } from "next/server";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess } from "@/lib/access-control";

/**
 * The "PDF" download now redirects to a print-friendly HTML page that the user
 * can save as PDF via their browser. The page is /planner/print and renders a
 * full coloured schedule table.
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const campusId = url.searchParams.get("campusId") ?? getDefaultCampusId(user);
    if (!campusId) return new Response("No campus", { status: 400 });
    requireCampusAccess(user, campusId);
    const filterType = url.searchParams.get("filterType") ?? "all";
    const filterId = url.searchParams.get("filterId") ?? "";
    const target = new URL(`/planner/print?campusId=${encodeURIComponent(campusId)}&filterType=${encodeURIComponent(filterType)}&filterId=${encodeURIComponent(filterId)}`, request.url);
    return NextResponse.redirect(target);
  } catch (error) {
    return jsonError(error);
  }
}
