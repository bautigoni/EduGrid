import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess } from "@/lib/access-control";

/**
 * Pre-flight data consistency check. Returns a list of blockers + warnings the
 * planner shows before letting the user generate. Mirrors PART 12 of the spec.
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const campusId = url.searchParams.get("campusId") ?? getDefaultCampusId(user);
    if (!campusId) return NextResponse.json({ ok: false, blockers: ["No hay sede seleccionada."], warnings: [] });
    requireCampusAccess(user, campusId);
    const db = getDb();

    const counts = {
      courses: (db.prepare("SELECT COUNT(*) AS c FROM courses WHERE campus_id = ? AND is_active = 1").get(campusId) as { c: number }).c,
      subjects: (db.prepare("SELECT COUNT(*) AS c FROM subjects WHERE campus_id = ? AND is_active = 1").get(campusId) as { c: number }).c,
      teachers: (db.prepare("SELECT COUNT(*) AS c FROM teachers WHERE campus_id = ? AND is_active = 1").get(campusId) as { c: number }).c,
      timeBlocks: (db.prepare("SELECT COUNT(*) AS c FROM time_blocks WHERE campus_id = ? AND is_assignable = 1").get(campusId) as { c: number }).c,
      requirements: (db.prepare(
        `SELECT COUNT(*) AS c FROM course_subject_requirements csr
         JOIN courses c ON c.id = csr.course_id
         WHERE c.campus_id = ? AND c.is_active = 1`
      ).get(campusId) as { c: number }).c,
      teacherAvailability: (db.prepare(
        `SELECT COUNT(*) AS c FROM teacher_availability ta
         JOIN teachers t ON t.id = ta.teacher_id
         WHERE t.campus_id = ?`
      ).get(campusId) as { c: number }).c,
      courseAvailability: (db.prepare(
        `SELECT COUNT(*) AS c FROM course_availability ca
         JOIN courses c ON c.id = ca.course_id
         WHERE c.campus_id = ?`
      ).get(campusId) as { c: number }).c,
      matrixCells: (db.prepare(
        `SELECT COUNT(*) AS c FROM teacher_subject_course_eligibility tsce
         JOIN teachers t ON t.id = tsce.teacher_id
         WHERE t.campus_id = ?`
      ).get(campusId) as { c: number }).c
    };

    const blockers: string[] = [];
    const warnings: string[] = [];

    if (counts.courses === 0) blockers.push("No hay cursos cargados.");
    if (counts.subjects === 0) blockers.push("No hay materias cargadas.");
    if (counts.teachers === 0) blockers.push("No hay docentes cargados.");
    if (counts.timeBlocks === 0) blockers.push("La sede no tiene bloques horarios definidos.");
    if (counts.requirements === 0) blockers.push("Ningún curso tiene materias requeridas.");

    // Per-course / per-teacher granular checks
    const coursesWithoutRequirements = db.prepare(
      `SELECT c.name FROM courses c WHERE c.campus_id = ? AND c.is_active = 1
       AND NOT EXISTS (SELECT 1 FROM course_subject_requirements csr WHERE csr.course_id = c.id)`
    ).all(campusId) as Array<{ name: string }>;
    for (const c of coursesWithoutRequirements) {
      warnings.push(`El curso ${c.name} no tiene materias asignadas todavía.`);
    }

    const coursesWithoutAvailability = db.prepare(
      `SELECT c.name FROM courses c WHERE c.campus_id = ? AND c.is_active = 1
       AND NOT EXISTS (SELECT 1 FROM course_availability ca WHERE ca.course_id = c.id)`
    ).all(campusId) as Array<{ name: string }>;
    for (const c of coursesWithoutAvailability) {
      warnings.push(`El curso ${c.name} no tiene disponibilidad cargada (se asumen todos los bloques disponibles).`);
    }

    const teachersWithoutAvailability = db.prepare(
      `SELECT t.full_name FROM teachers t WHERE t.campus_id = ? AND t.is_active = 1
       AND NOT EXISTS (SELECT 1 FROM teacher_availability ta WHERE ta.teacher_id = t.id)`
    ).all(campusId) as Array<{ full_name: string }>;
    for (const t of teachersWithoutAvailability) {
      warnings.push(`${t.full_name} no tiene disponibilidad cargada.`);
    }

    const teachersWithoutHours = db.prepare(
      "SELECT full_name FROM teachers WHERE campus_id = ? AND is_active = 1 AND (contractual_weekly_minutes IS NULL OR contractual_weekly_minutes = 0)"
    ).all(campusId) as Array<{ full_name: string }>;
    for (const t of teachersWithoutHours) {
      warnings.push(`${t.full_name} no tiene carga horaria contractual definida.`);
    }

    // Requirements pointing to inactive subject/course
    const requirementsOnInactive = db.prepare(
      `SELECT c.name AS course_name, s.name AS subject_name FROM course_subject_requirements csr
       JOIN courses c ON c.id = csr.course_id
       JOIN subjects s ON s.id = csr.subject_id
       WHERE c.campus_id = ? AND (c.is_active = 0 OR s.is_active = 0)`
    ).all(campusId) as Array<{ course_name: string; subject_name: string }>;
    for (const r of requirementsOnInactive) {
      blockers.push(`La materia ${r.subject_name} del curso ${r.course_name} apunta a un registro inactivo.`);
    }

    // Requirements without any eligible teacher (uses combined matrix; falls back to legacy)
    const reqsWithoutEligibleTeacher = db.prepare(
      `SELECT c.name AS course_name, s.name AS subject_name FROM course_subject_requirements csr
       JOIN courses c ON c.id = csr.course_id
       JOIN subjects s ON s.id = csr.subject_id
       WHERE c.campus_id = ? AND c.is_active = 1 AND s.is_active = 1
         AND NOT EXISTS (
           SELECT 1 FROM teacher_subject_course_eligibility tsce
           WHERE tsce.subject_id = csr.subject_id AND tsce.course_id = csr.course_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM teacher_subjects ts
           JOIN teachers t ON t.id = ts.teacher_id
           WHERE ts.subject_id = csr.subject_id AND t.campus_id = c.campus_id
             AND (
               NOT EXISTS (SELECT 1 FROM teacher_course_eligibility tce WHERE tce.teacher_id = t.id)
               OR EXISTS (SELECT 1 FROM teacher_course_eligibility tce WHERE tce.teacher_id = t.id AND tce.course_id = csr.course_id)
             )
         )`
    ).all(campusId) as Array<{ course_name: string; subject_name: string }>;
    for (const r of reqsWithoutEligibleTeacher) {
      blockers.push(`Sin docente habilitado para ${r.subject_name} en ${r.course_name}.`);
    }

    return NextResponse.json({
      ok: blockers.length === 0,
      counts,
      blockers,
      warnings
    });
  } catch (error) {
    return jsonError(error);
  }
}
