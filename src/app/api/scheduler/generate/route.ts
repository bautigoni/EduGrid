import { NextResponse } from "next/server";
import { buildOptimizerPayload, callOptimizer, explainGenerationConflicts } from "@/lib/scheduler";
import { campuses, defaultCampusId, scheduleEntries, insights } from "@/lib/demo-data";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";

export async function POST(request: Request) {
  let scopedCampusId = defaultCampusId;
  let scopedInsights = insights;
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER"]);
    const body = await request.json().catch(() => ({}));
    const campusId = body.campusId ?? getDefaultCampusId(user) ?? defaultCampusId;
    requireCampusAccess(user, campusId);
    scopedCampusId = campusId;
    const hiddenCampuses = user.role === "SUPERADMIN" ? [] : campuses.filter((campus) => campus.id !== campusId).map((campus) => campus.name.split(" ").at(-1) ?? campus.name);
    scopedInsights = insights.filter((insight) => hiddenCampuses.every((campusName) => !insight.includes(campusName)));
    const payload = buildOptimizerPayload(campusId);

    const result = await callOptimizer(payload);
    return NextResponse.json({
      status: "SUCCESS",
      entries: result.entries,
      conflicts: result.conflicts ?? explainGenerationConflicts(campusId),
      insights: result.insights ?? scopedInsights
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    return NextResponse.json({
      status: "SUCCESS",
      entries: scheduleEntries.filter((entry) => entry.campusId === scopedCampusId),
      conflicts: explainGenerationConflicts(scopedCampusId),
      insights: scopedInsights,
      source: "fallback",
      note: error instanceof Error ? error.message : "Optimizer unavailable, returned deterministic demo schedule."
    });
  }
}
