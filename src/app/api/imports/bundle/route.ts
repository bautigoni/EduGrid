import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { normalizeKey, parseCsvAll } from "@/lib/imports";

/**
 * Bundle importer.
 *
 * Derives every core entity needed by the scheduler from at most three CSV
 * files (only `courseSchedule` is required):
 *
 *   - courseSchedule       → courses, subjects, teachers, course×subject
 *                            requirements (counted from row occurrences),
 *                            teacher×subject×course eligibility.
 *   - teacherAvailability  → teachers (created if missing), availability
 *                            replaced per teacher, contractual hours updated
 *                            when present.
 *   - classroomSchedule    → informational only. We don't create rooms; we just
 *                            attach the classroom label to courses when not yet
 *                            set.
 *
 * All inserts run inside a single SQLite transaction. The endpoint returns a
 * structured summary so the UI can render the spec's six counters + warnings.
 */
const schema = z.object({
  campusId: z.string().min(1),
  courseSchedule: z.string().optional(),
  teacherAvailability: z.string().optional(),
  classroomSchedule: z.string().optional()
});

type Counts = {
  coursesCreated: number;
  subjectsCreated: number;
  teachersCreated: number;
  requirementsCreated: number;
  eligibilityCreated: number;
  availabilityRowsCreated: number;
};

const DAY_MAP: Record<string, number> = {
  lunes: 0, lun: 0, mon: 0, monday: 0,
  martes: 1, mar: 1, tue: 1, tuesday: 1,
  miercoles: 2, mier: 2, mie: 2, wed: 2, wednesday: 2,
  jueves: 3, jue: 3, thu: 3, thursday: 3,
  viernes: 4, vie: 4, fri: 4, friday: 4
};

function pickColumn(columns: string[], candidates: string[]): string | null {
  const normalized = columns.map((c) => normalizeKey(c));
  for (const cand of candidates) {
    const idx = normalized.indexOf(normalizeKey(cand));
    if (idx >= 0) return columns[idx];
  }
  return null;
}

function intOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "COORDINADOR_HORARIOS", "CAMPUS_ADMIN", "SCHEDULER"]);
    const body = schema.parse(await request.json());
    requireCampusAccess(user, body.campusId);
    if (!body.courseSchedule && !body.teacherAvailability) {
      return NextResponse.json({ message: "Subí al menos courseSchedule o teacherAvailability." }, { status: 400 });
    }

    const db = getDb();
    const now = nowIso();
    const warnings: string[] = [];
    const counts: Counts = {
      coursesCreated: 0,
      subjectsCreated: 0,
      teachersCreated: 0,
      requirementsCreated: 0,
      eligibilityCreated: 0,
      availabilityRowsCreated: 0
    };

    // Build name → id lookup maps for the campus so we can avoid duplicates and
    // re-use existing rows from previous imports / manual creation.
    const courseIdByKey = new Map<string, string>();
    const subjectIdByKey = new Map<string, string>();
    const teacherIdByKey = new Map<string, string>();
    for (const row of db.prepare("SELECT id, name FROM courses WHERE campus_id = ?").all(body.campusId) as Array<{ id: string; name: string }>) {
      courseIdByKey.set(normalizeKey(row.name), row.id);
    }
    for (const row of db.prepare("SELECT id, name FROM subjects WHERE campus_id = ?").all(body.campusId) as Array<{ id: string; name: string }>) {
      subjectIdByKey.set(normalizeKey(row.name), row.id);
    }
    for (const row of db.prepare("SELECT id, full_name FROM teachers WHERE campus_id = ?").all(body.campusId) as Array<{ id: string; full_name: string }>) {
      teacherIdByKey.set(normalizeKey(row.full_name), row.id);
    }

    // Time blocks for this campus, indexed by (day, start_time HH:MM) and by
    // (day, label) so we can match either column shape.
    type Block = { id: string; day_of_week: number; start_time: string; end_time: string; label: string; is_assignable: number };
    const blocks = db
      .prepare("SELECT id, day_of_week, start_time, end_time, label, is_assignable FROM time_blocks WHERE campus_id = ?")
      .all(body.campusId) as Block[];
    const blockByKey = new Map<string, Block>();
    for (const b of blocks) {
      blockByKey.set(`${b.day_of_week}|${b.start_time}`, b);
      blockByKey.set(`${b.day_of_week}|${normalizeKey(b.label)}`, b);
    }
    function resolveBlock(day: number, startOrLabel: string): Block | null {
      const tryStart = startOrLabel.match(/(\d{1,2}):(\d{2})/);
      if (tryStart) {
        const k = `${day}|${String(tryStart[1]).padStart(2, "0")}:${tryStart[2]}`;
        const hit = blockByKey.get(k);
        if (hit) return hit;
      }
      return blockByKey.get(`${day}|${normalizeKey(startOrLabel)}`) ?? null;
    }
    function resolveDay(value: string): number | null {
      const key = normalizeKey(value);
      if (key in DAY_MAP) return DAY_MAP[key];
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0 && n <= 4) return n;
      return null;
    }

    // Prepared inserts ------------------------------------------------------
    const insertCourse = db.prepare(
      "INSERT INTO courses (id, campus_id, name, year, division, default_classroom_label, student_count, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,1,?,?)"
    );
    const insertSubject = db.prepare(
      "INSERT INTO subjects (id, campus_id, name, code, color, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,?,?)"
    );
    const insertTeacher = db.prepare(
      "INSERT INTO teachers (id, campus_id, full_name, email, contractual_weekly_minutes, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,?,?)"
    );
    const insertReq = db.prepare(
      "INSERT INTO course_subject_requirements (id, campus_id, course_id, subject_id, weekly_blocks_required, created_at, updated_at) VALUES (?,?,?,?,?,?,?)"
    );
    const updateReq = db.prepare(
      "UPDATE course_subject_requirements SET weekly_blocks_required = ?, updated_at = ? WHERE course_id = ? AND subject_id = ?"
    );
    const selectReq = db.prepare(
      "SELECT id FROM course_subject_requirements WHERE course_id = ? AND subject_id = ?"
    );
    const insertMatrix = db.prepare(
      "INSERT OR IGNORE INTO teacher_subject_course_eligibility (id, teacher_id, subject_id, course_id, created_at, updated_at) VALUES (?,?,?,?,?,?)"
    );
    const insertLegacySubject = db.prepare(
      "INSERT OR IGNORE INTO teacher_subjects (id, teacher_id, subject_id, created_at) VALUES (?,?,?,?)"
    );
    const deleteTeacherAvail = db.prepare(
      "DELETE FROM teacher_availability WHERE teacher_id = ?"
    );
    const insertTeacherAvail = db.prepare(
      "INSERT OR REPLACE INTO teacher_availability (id, teacher_id, time_block_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?)"
    );
    const updateTeacherHours = db.prepare(
      "UPDATE teachers SET contractual_weekly_minutes = ?, updated_at = ? WHERE id = ?"
    );
    const updateCourseClassroom = db.prepare(
      "UPDATE courses SET default_classroom_label = ?, updated_at = ? WHERE id = ? AND (default_classroom_label IS NULL OR default_classroom_label = '')"
    );

    function ensureCourse(rawName: string, classroom?: string): string {
      const name = rawName.replace(/\s+/g, " ").trim();
      if (!name) return "";
      const key = normalizeKey(name);
      const existing = courseIdByKey.get(key);
      if (existing) {
        if (classroom) updateCourseClassroom.run(classroom, now, existing);
        return existing;
      }
      const id = newId("crs");
      // Try to split "1A" → year 1, division "A".
      const m = name.match(/^(\d+)\s*([A-Za-z]+)$/);
      const year = m ? Number(m[1]) : null;
      const division = m ? m[2].toUpperCase() : null;
      insertCourse.run(id, body.campusId, name, year, division, classroom ?? `Aula ${name}`, 28, now, now);
      courseIdByKey.set(key, id);
      counts.coursesCreated += 1;
      return id;
    }
    function ensureSubject(rawName: string): string {
      const name = rawName.replace(/\s+/g, " ").trim();
      if (!name) return "";
      const key = normalizeKey(name);
      const existing = subjectIdByKey.get(key);
      if (existing) return existing;
      const id = newId("sub");
      const code = name.slice(0, 3).toUpperCase();
      insertSubject.run(id, body.campusId, name, code, null, now, now);
      subjectIdByKey.set(key, id);
      counts.subjectsCreated += 1;
      return id;
    }
    function ensureTeacher(rawName: string, email?: string | null, hours?: number | null): string {
      const name = rawName.replace(/\s+/g, " ").trim();
      if (!name) return "";
      const key = normalizeKey(name);
      const existing = teacherIdByKey.get(key);
      if (existing) {
        if (hours != null) updateTeacherHours.run(Math.round(hours * 60), now, existing);
        return existing;
      }
      const id = newId("tch");
      insertTeacher.run(id, body.campusId, name, email ?? null, hours != null ? Math.round(hours * 60) : 0, now, now);
      teacherIdByKey.set(key, id);
      counts.teachersCreated += 1;
      return id;
    }

    const tx = db.transaction(() => {
      // ------------------ courseSchedule ------------------
      if (body.courseSchedule) {
        const { columns, rows } = parseCsvAll(body.courseSchedule);
        const colCourse = pickColumn(columns, ["course", "curso"]);
        const colDivision = pickColumn(columns, ["division", "división"]);
        const colSubject = pickColumn(columns, ["subject", "materia"]);
        const colTeacher = pickColumn(columns, ["teacher", "docente", "profesor"]);
        const colClassroom = pickColumn(columns, ["classroom", "aula", "salon", "salón"]);
        if (!colCourse || !colSubject) {
          throw Object.assign(new Error("courseSchedule debe tener al menos columnas Course y Subject."), { status: 400 });
        }
        // Aggregate (course, subject) counts and (teacher, subject, course) sets.
        const reqCounts = new Map<string, { courseId: string; subjectId: string; count: number }>();
        const matrixSeen = new Set<string>();
        let skipped = 0;
        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i];
          const rawCourse = row[colCourse]?.trim() ?? "";
          const subjectName = row[colSubject]?.trim();
          if (!rawCourse || !subjectName) { skipped += 1; continue; }
          // Combine "course + division" if both are present and the course
          // column does not already contain the division.
          const courseName = (() => {
            if (colDivision && row[colDivision]) {
              const div = row[colDivision].trim();
              if (div && !rawCourse.toUpperCase().endsWith(div.toUpperCase())) {
                return `${rawCourse}${div}`;
              }
            }
            return rawCourse;
          })();
          const courseId = ensureCourse(courseName, colClassroom ? row[colClassroom]?.trim() || undefined : undefined);
          const subjectId = ensureSubject(subjectName);
          const reqKey = `${courseId}|${subjectId}`;
          const prev = reqCounts.get(reqKey);
          if (prev) prev.count += 1;
          else reqCounts.set(reqKey, { courseId, subjectId, count: 1 });

          if (colTeacher) {
            const teacherName = row[colTeacher]?.trim();
            if (teacherName) {
              const teacherId = ensureTeacher(teacherName);
              const mKey = `${teacherId}|${subjectId}|${courseId}`;
              if (!matrixSeen.has(mKey)) {
                matrixSeen.add(mKey);
                const result = insertMatrix.run(newId("tsce"), teacherId, subjectId, courseId, now, now);
                if (result.changes > 0) counts.eligibilityCreated += 1;
                insertLegacySubject.run(newId("ts"), teacherId, subjectId, now);
              }
            }
          }
        }
        if (skipped > 0) warnings.push(`${skipped} fila(s) ignoradas por falta de Curso o Materia.`);
        // Persist requirements: upsert weekly_blocks_required = count.
        for (const { courseId, subjectId, count } of reqCounts.values()) {
          const existing = selectReq.get(courseId, subjectId) as { id: string } | undefined;
          if (existing) {
            updateReq.run(count, now, courseId, subjectId);
          } else {
            insertReq.run(newId("csr"), body.campusId, courseId, subjectId, count, now, now);
            counts.requirementsCreated += 1;
          }
        }
      }

      // ------------------ teacherAvailability ------------------
      if (body.teacherAvailability) {
        const { columns, rows } = parseCsvAll(body.teacherAvailability);
        const colTeacher = pickColumn(columns, ["teacher name", "teacher", "docente", "profesor", "nombre"]);
        const colEmail = pickColumn(columns, ["email", "correo"]);
        const colDay = pickColumn(columns, ["day", "dia", "día"]);
        const colStart = pickColumn(columns, ["start time", "start", "inicio", "hora", "block label", "bloque"]);
        const colStatus = pickColumn(columns, ["availability status", "status", "estado", "disponibilidad"]);
        const colHours = pickColumn(columns, ["contractual hours", "carga horaria", "carga", "horas semanales", "horas"]);
        if (!colTeacher) throw Object.assign(new Error("teacherAvailability debe incluir Teacher name."), { status: 400 });

        // Group rows by teacher so we can replace their full availability set.
        type Avail = { day: number; key: string; status: "AVAILABLE" | "UNAVAILABLE" };
        const byTeacher = new Map<string, { name: string; email: string | null; hours: number | null; rows: Avail[] }>();
        let skipped = 0;
        for (const row of rows) {
          const tName = row[colTeacher]?.trim();
          if (!tName) { skipped += 1; continue; }
          const tKey = normalizeKey(tName);
          if (!byTeacher.has(tKey)) {
            byTeacher.set(tKey, {
              name: tName,
              email: colEmail ? (row[colEmail]?.trim() || null) : null,
              hours: colHours ? intOrNull(row[colHours]) : null,
              rows: []
            });
          }
          const bucket = byTeacher.get(tKey)!;
          if (colHours && bucket.hours == null) {
            const h = intOrNull(row[colHours]);
            if (h != null) bucket.hours = h;
          }
          if (colDay && colStart) {
            const day = resolveDay(row[colDay] ?? "");
            const start = row[colStart] ?? "";
            if (day == null || !start) continue;
            const statusRaw = colStatus ? (row[colStatus] ?? "") : "AVAILABLE";
            const nKey = normalizeKey(statusRaw);
            const status: "AVAILABLE" | "UNAVAILABLE" = nKey.startsWith("no") || nKey.startsWith("un") ? "UNAVAILABLE" : "AVAILABLE";
            bucket.rows.push({ day, key: start, status });
          }
        }
        if (skipped > 0) warnings.push(`${skipped} fila(s) de disponibilidad ignoradas por falta de docente.`);

        for (const bucket of byTeacher.values()) {
          const teacherId = ensureTeacher(bucket.name, bucket.email, bucket.hours);
          if (bucket.rows.length === 0) {
            warnings.push(`${bucket.name}: no se cargó disponibilidad (faltan columnas Day/Start o filas).`);
            continue;
          }
          // Replace the entire availability set so re-imports stay deterministic.
          deleteTeacherAvail.run(teacherId);
          for (const a of bucket.rows) {
            const block = resolveBlock(a.day, a.key);
            if (!block) {
              warnings.push(`Bloque no encontrado: día ${a.day}, "${a.key}" (docente ${bucket.name}).`);
              continue;
            }
            if (!block.is_assignable) continue;
            insertTeacherAvail.run(newId("ta"), teacherId, block.id, a.status, now, now);
            counts.availabilityRowsCreated += 1;
          }
        }
      }

      // ------------------ classroomSchedule (informational) ------------------
      if (body.classroomSchedule) {
        const { columns, rows } = parseCsvAll(body.classroomSchedule);
        const colCourse = pickColumn(columns, ["course", "curso"]);
        const colClassroom = pickColumn(columns, ["classroom", "aula"]);
        if (colCourse && colClassroom) {
          for (const row of rows) {
            const courseName = row[colCourse]?.trim();
            const classroom = row[colClassroom]?.trim();
            if (!courseName || !classroom) continue;
            const id = courseIdByKey.get(normalizeKey(courseName));
            if (id) updateCourseClassroom.run(classroom, now, id);
          }
        }
      }
    });

    tx();

    // Post warnings driven by final state
    const teachersNoAvail = db.prepare(
      `SELECT full_name FROM teachers WHERE campus_id = ? AND is_active = 1 AND NOT EXISTS (SELECT 1 FROM teacher_availability ta WHERE ta.teacher_id = teachers.id)`
    ).all(body.campusId) as Array<{ full_name: string }>;
    for (const t of teachersNoAvail) warnings.push(`Docente sin disponibilidad: ${t.full_name}.`);
    const coursesNoReq = db.prepare(
      `SELECT name FROM courses WHERE campus_id = ? AND is_active = 1 AND NOT EXISTS (SELECT 1 FROM course_subject_requirements csr WHERE csr.course_id = courses.id)`
    ).all(body.campusId) as Array<{ name: string }>;
    for (const c of coursesNoReq) warnings.push(`Curso sin materias requeridas: ${c.name}.`);

    return NextResponse.json({ ok: true, counts, warnings });
  } catch (error) {
    return jsonError(error);
  }
}
