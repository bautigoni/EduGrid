import { NextResponse } from "next/server";
import { generateScheduleForCampus } from "@/lib/scheduler";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const body = await request.json().catch(() => ({}));
    const campusId = body.campusId ?? getDefaultCampusId(user);
    if (!campusId) return NextResponse.json({ message: "No hay sede seleccionada." }, { status: 400 });
    requireCampusAccess(user, campusId);
    const result = generateScheduleForCampus(campusId, {
      dryRun: Boolean(body.dryRun),
      maxRuntimeMs: typeof body.maxRuntimeMs === "number" ? body.maxRuntimeMs : undefined,
      maxIterations: typeof body.maxIterations === "number" ? body.maxIterations : undefined,
      maxBacktrackingDepth: typeof body.maxBacktrackingDepth === "number" ? body.maxBacktrackingDepth : undefined,
      maxCandidateAttemptsPerNeed: typeof body.maxCandidateAttemptsPerNeed === "number" ? body.maxCandidateAttemptsPerNeed : undefined
    });
    return NextResponse.json({
      status: result.status,
      userMessage: result.userMessage,
      entries: result.entries,
      conflicts: result.conflicts,
      summary: result.summary,
      diagnostics: result.diagnostics,
      durationMs: result.durationMs,
      dryRun: result.dryRun,
      scheduleVersionId: result.scheduleVersionId
    });
  } catch (error) {
    return jsonError(error);
  }
}
