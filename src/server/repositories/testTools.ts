import { getDb } from "@/lib/db";

/**
 * Hard-delete helpers for the test-tools panel. Every call is wrapped in a
 * single SQLite transaction so partial wipes can never leave dangling rows.
 *
 * `campusId` scope is mandatory unless you call `*ForAllCampuses`. The
 * dependent-table list mirrors the spec exactly:
 *   courses → course_availability / course_subject_requirements /
 *             teacher_subject_course_eligibility(course) /
 *             project_courses / schedule_assignments / conflicts /
 *             forced_assignments
 *   teachers → teacher_availability / teacher_subjects /
 *              teacher_course_eligibility /
 *              teacher_subject_course_eligibility(teacher) /
 *              project_teachers / schedule_assignments / conflicts /
 *              forced_assignments
 *   subjects → course_subject_requirements / teacher_subjects /
 *              teacher_subject_course_eligibility(subject) /
 *              schedule_assignments / conflicts / forced_assignments
 */
function tx<T>(fn: () => T): T {
  const db = getDb();
  const transaction = db.transaction(fn);
  return transaction();
}

export function clearCoursesByCampus(campusId: string) {
  return tx(() => {
    const db = getDb();
    db.prepare(
      "DELETE FROM course_availability WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM course_subject_requirements WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_subject_course_eligibility WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_course_eligibility WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM project_courses WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM forced_assignments WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM schedule_assignments WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare("DELETE FROM conflicts WHERE entity_type = 'COURSE' AND campus_id = ?").run(campusId);
    const info = db.prepare("DELETE FROM courses WHERE campus_id = ?").run(campusId);
    return { deleted: info.changes };
  });
}

export function clearTeachersByCampus(campusId: string) {
  return tx(() => {
    const db = getDb();
    db.prepare(
      "DELETE FROM teacher_availability WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_subjects WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_course_eligibility WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_subject_course_eligibility WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM project_teachers WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM forced_assignments WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM schedule_assignments WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare("DELETE FROM conflicts WHERE entity_type = 'TEACHER' AND campus_id = ?").run(campusId);
    const info = db.prepare("DELETE FROM teachers WHERE campus_id = ?").run(campusId);
    return { deleted: info.changes };
  });
}

export function clearSubjectsByCampus(campusId: string) {
  return tx(() => {
    const db = getDb();
    db.prepare(
      "DELETE FROM course_subject_requirements WHERE subject_id IN (SELECT id FROM subjects WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_subjects WHERE subject_id IN (SELECT id FROM subjects WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_subject_course_eligibility WHERE subject_id IN (SELECT id FROM subjects WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM forced_assignments WHERE subject_id IN (SELECT id FROM subjects WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM schedule_assignments WHERE subject_id IN (SELECT id FROM subjects WHERE campus_id = ?)"
    ).run(campusId);
    const info = db.prepare("DELETE FROM subjects WHERE campus_id = ?").run(campusId);
    return { deleted: info.changes };
  });
}

export function clearTeacherAvailabilityByCampus(campusId: string) {
  const db = getDb();
  const info = db
    .prepare("DELETE FROM teacher_availability WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)")
    .run(campusId);
  return { deleted: info.changes };
}

export function clearCourseAvailabilityByCampus(campusId: string) {
  const db = getDb();
  const info = db
    .prepare("DELETE FROM course_availability WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)")
    .run(campusId);
  return { deleted: info.changes };
}

export function clearTeacherEligibilityByCampus(campusId: string) {
  return tx(() => {
    const db = getDb();
    db.prepare(
      "DELETE FROM teacher_subject_course_eligibility WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_subjects WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
    db.prepare(
      "DELETE FROM teacher_course_eligibility WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)"
    ).run(campusId);
  });
}

export function clearProjectsByCampus(campusId: string) {
  return tx(() => {
    const db = getDb();
    db.prepare("DELETE FROM project_teachers WHERE project_id IN (SELECT id FROM projects WHERE campus_id = ?)").run(campusId);
    db.prepare("DELETE FROM project_courses WHERE project_id IN (SELECT id FROM projects WHERE campus_id = ?)").run(campusId);
    const info = db.prepare("DELETE FROM projects WHERE campus_id = ?").run(campusId);
    return { deleted: info.changes };
  });
}

export function clearSchedulesByCampus(campusId: string) {
  return tx(() => {
    const db = getDb();
    db.prepare("DELETE FROM schedule_assignments WHERE campus_id = ?").run(campusId);
    db.prepare("DELETE FROM schedule_versions WHERE campus_id = ?").run(campusId);
    db.prepare("DELETE FROM conflicts WHERE campus_id = ?").run(campusId);
  });
}

export function clearFailedGenerationByCampus(campusId: string) {
  return tx(() => {
    const db = getDb();
    const failedIds = db
      .prepare("SELECT id FROM schedule_versions WHERE campus_id = ? AND status IN ('FAILED','FAILED_TIMEOUT','FAILED_ERROR','GENERATING','DRAFT')")
      .all(campusId) as Array<{ id: string }>;
    for (const row of failedIds) {
      db.prepare("DELETE FROM schedule_assignments WHERE schedule_version_id = ?").run(row.id);
      db.prepare("DELETE FROM conflicts WHERE schedule_version_id = ?").run(row.id);
      db.prepare("DELETE FROM schedule_versions WHERE id = ?").run(row.id);
    }
    return { deleted: failedIds.length };
  });
}

export function clearConflictsByCampus(campusId: string) {
  const db = getDb();
  const info = db.prepare("DELETE FROM conflicts WHERE campus_id = ?").run(campusId);
  return { deleted: info.changes };
}

/** Wipes operational data for a campus but keeps the campus row + time blocks. */
export function resetCampusData(campusId: string) {
  return tx(() => {
    clearSchedulesByCampus(campusId);
    clearProjectsByCampus(campusId);
    clearTeachersByCampus(campusId);
    clearCoursesByCampus(campusId);
    clearSubjectsByCampus(campusId);
  });
}

/** Nukes every campus's operational data. Time blocks and users survive. */
export function resetAllSystem() {
  return tx(() => {
    const db = getDb();
    db.prepare("DELETE FROM schedule_assignments").run();
    db.prepare("DELETE FROM schedule_versions").run();
    db.prepare("DELETE FROM conflicts").run();
    db.prepare("DELETE FROM forced_assignments").run();
    db.prepare("DELETE FROM project_teachers").run();
    db.prepare("DELETE FROM project_courses").run();
    db.prepare("DELETE FROM projects").run();
    db.prepare("DELETE FROM teacher_subject_course_eligibility").run();
    db.prepare("DELETE FROM teacher_subjects").run();
    db.prepare("DELETE FROM teacher_course_eligibility").run();
    db.prepare("DELETE FROM teacher_availability").run();
    db.prepare("DELETE FROM course_availability").run();
    db.prepare("DELETE FROM course_subject_requirements").run();
    db.prepare("DELETE FROM teachers").run();
    db.prepare("DELETE FROM courses").run();
    db.prepare("DELETE FROM subjects").run();
  });
}
