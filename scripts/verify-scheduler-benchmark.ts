/* eslint-disable no-console */
import { getDb } from "../src/lib/db";
import { generateScheduleForCampus } from "../src/lib/scheduler";

type CampusCandidate = { id: string; name: string; teachers: number; courses: number };

function main() {
  const db = getDb();
  const campus = process.env.BENCHMARK_CAMPUS_ID
    ? db.prepare(
        `SELECT c.id, c.name,
                (SELECT COUNT(*) FROM teachers t WHERE t.campus_id = c.id AND t.is_active = 1) AS teachers,
                (SELECT COUNT(*) FROM courses co WHERE co.campus_id = c.id AND co.is_active = 1) AS courses
         FROM campuses c WHERE c.id = ?`
      ).get(process.env.BENCHMARK_CAMPUS_ID) as CampusCandidate | undefined
    : db.prepare(
        `SELECT c.id, c.name,
                COUNT(DISTINCT t.id) AS teachers,
                COUNT(DISTINCT co.id) AS courses
         FROM campuses c
         LEFT JOIN teachers t ON t.campus_id = c.id AND t.is_active = 1
         LEFT JOIN courses co ON co.campus_id = c.id AND co.is_active = 1
         GROUP BY c.id
         ORDER BY teachers DESC, courses DESC
         LIMIT 1`
      ).get() as CampusCandidate | undefined;

  if (!campus) {
    console.error("[verify:scheduler] No campus found. Set BENCHMARK_CAMPUS_ID if needed.");
    process.exit(1);
  }

  const result = generateScheduleForCampus(campus.id, {
    dryRun: true,
    maxRuntimeMs: 10_000,
    maxIterations: 200_000,
    maxBacktrackingDepth: 5,
    maxCandidateAttemptsPerNeed: 120
  });

  const courseTime = new Set<string>();
  const teacherTime = new Set<string>();
  let duplicatedAssignments = 0;
  for (const entry of result.entries) {
    if (entry.course_id) {
      const key = `${entry.course_id}|${entry.time_block_id}`;
      if (courseTime.has(key)) duplicatedAssignments += 1;
      courseTime.add(key);
    }
    if (entry.teacher_id) {
      const key = `${entry.teacher_id}|${entry.time_block_id}`;
      if (teacherTime.has(key)) duplicatedAssignments += 1;
      teacherTime.add(key);
    }
  }

  const projectDiagnosticKeys = new Set<string>();
  let duplicatedProjectErrors = 0;
  for (const conflict of result.conflicts) {
    if (conflict.type !== "UNFULFILLED_PROJECT") continue;
    const key = `${conflict.entity_id ?? ""}|${conflict.message}`;
    if (projectDiagnosticKeys.has(key)) duplicatedProjectErrors += 1;
    projectDiagnosticKeys.add(key);
  }

  const report = {
    campus: { id: campus.id, name: campus.name, teachers: campus.teachers, courses: campus.courses },
    status: result.status,
    durationMs: result.durationMs,
    totalAssignments: result.summary.assignments,
    coursesComplete: result.summary.coursesComplete,
    pendingBlocks: result.summary.pendingBlocks,
    criticalConflicts: result.summary.critical,
    warnings: result.summary.warnings,
    teachersIncomplete: result.summary.teachersIncomplete,
    duplicatedAssignments,
    duplicatedProjectErrors
  };

  console.log("[verify:scheduler]", JSON.stringify(report, null, 2));

  const passed =
    result.status === "SUCCESS" &&
    result.summary.coursesComplete === campus.courses &&
    result.summary.pendingBlocks === 0 &&
    result.summary.freeCourseBlocks === 0 &&
    result.summary.critical === 0 &&
    result.summary.teachersIncomplete === 0 &&
    duplicatedAssignments === 0 &&
    duplicatedProjectErrors === 0;

  if (!passed) {
    console.error("[verify:scheduler] Benchmark failed.");
    process.exit(1);
  }

  console.log("[verify:scheduler] Benchmark passed.");
}

main();
