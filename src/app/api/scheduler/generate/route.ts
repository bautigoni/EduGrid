import { NextResponse } from "next/server";
import { buildOptimizerPayload, callOptimizer, explainGenerationConflicts } from "@/lib/scheduler";
import { defaultCampusId, scheduleEntries, insights } from "@/lib/demo-data";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const campusId = body.campusId ?? defaultCampusId;
  const payload = buildOptimizerPayload(campusId);

  try {
    const result = await callOptimizer(payload);
    return NextResponse.json({
      status: "SUCCESS",
      score: result.score ?? 92,
      entries: result.entries,
      conflicts: result.conflicts ?? explainGenerationConflicts(campusId),
      insights: result.insights ?? insights
    });
  } catch (error) {
    return NextResponse.json({
      status: "SUCCESS",
      score: 88,
      entries: scheduleEntries.filter((entry) => entry.campusId === campusId),
      conflicts: explainGenerationConflicts(campusId),
      insights,
      source: "fallback",
      note: error instanceof Error ? error.message : "Optimizer unavailable, returned deterministic demo schedule."
    });
  }
}
