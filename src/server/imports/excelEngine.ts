import { getDb, newId, nowIso } from "@/lib/db";
import { normalizeKey } from "@/lib/imports";

export type ImportMode = "validate" | "create_missing" | "update_existing" | "replace_campus" | "merge";

export type SheetRows = Record<string, Record<string, string>[]>;

export type ImportSummary = {
  ok: boolean;
  mode: ImportMode;
  counts: {
    coursesCreated: number;
    coursesUpdated: number;
    subjectsCreated: number;
    subjectsUpdated: number;
    teachersCreated: number;
    teachersUpdated: number;
    requirementsCreated: number;
    requirementsUpdated: number;
    eligibilityCreated: number;
    teacherAvailabilityRows: number;
    courseAvailabilityRows: number;
    projectsCreated: number;
    forcedCreated: number;
  };
  detected: {
    courses: number;
    subjects: number;
    teachers: number;
    requirements: number;
    eligibility: number;
    teacherAvailability: number;
    courseAvailability: number;
    projects: number;
    forced: number;
  };
  warnings: string[];
  errors: string[];
};

const DAY_MAP: Record<string, number> = {
  lunes: 0, lun: 0, monday: 0, mon: 0,
  martes: 1, mar: 1, tuesday: 1, tue: 1,
  miercoles: 2, mier: 2, mie: 2, wednesday: 2, wed: 2,
  jueves: 3, jue: 3, thursday: 3, thu: 3,
  viernes: 4, vie: 4, friday: 4, fri: 4
};

const STATUS_AVAILABLE = new Set(["available", "disponible", "si", "sí", "yes", "1", "true"]);
const STATUS_UNAVAILABLE = new Set(["unavailable", "no disponible", "no", "0", "false"]);

function pickColumn(columns: string[], candidates: string[]): string | null {
  if (columns.length === 0) return null;
  const normalized = columns.map((c) => normalizeKey(c));
  for (const cand of candidates) {
    const idx = normalized.indexOf(normalizeKey(cand));
    if (idx >= 0) return columns[idx];
  }
  return null;
}
function rowVal(row: Record<string, string>, col: string | null): string {
  if (!col) return "";
  return (row[col] ?? "").toString().trim();
}
function resolveDay(value: string): number | null {
  const key = normalizeKey(value);
  if (key in DAY_MAP) return DAY_MAP[key];
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0 && n <= 4) return n;
  return null;
}
function resolveStatus(value: string): "AVAILABLE" | "UNAVAILABLE" {
  const key = normalizeKey(value);
  if (STATUS_UNAVAILABLE.has(key)) return "UNAVAILABLE";
  if (STATUS_AVAILABLE.has(key) || !key) return "AVAILABLE";
  return key.startsWith("no") || key.startsWith("un") ? "UNAVAILABLE" : "AVAILABLE";
}
function normalizeTime(value: string): string | null {
  const m = value.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return `${String(m[1]).padStart(2, "0")}:${m[2]}`;
}

const SHEET_ALIASES: Record<string, string[]> = {
  courses: ["cursos", "courses"],
  subjects: ["materias", "subjects"],
  teachers: ["docentes", "teachers", "profesores"],
  requirements: ["carga por curso", "carga", "requirements", "course subject"],
  matrix: ["habilitaciones docentes", "habilitaciones", "matriz", "matrix", "eligibility"],
  teacherAvailability: ["disponibilidad docentes", "disponibilidad docente", "teacher availability"],
  courseAvailability: ["disponibilidad cursos", "disponibilidad curso", "course availability"],
  projects: ["proyectos", "projects", "electivas", "optativas"],
  specialRooms: ["aulas especiales", "aulas", "special rooms"],
  forced: ["forzados", "forzados opcional", "forced", "manual"]
};

/** Resolve a logical sheet key against the actual workbook sheet names. */
export function resolveSheet(workbook: SheetRows, key: keyof typeof SHEET_ALIASES): Record<string, string>[] | null {
  const names = Object.keys(workbook);
  for (const alias of SHEET_ALIASES[key]) {
    const aliasKey = normalizeKey(alias);
    const hit = names.find((n) => normalizeKey(n) === aliasKey);
    if (hit) return workbook[hit];
  }
  return null;
}

export function runExcelImport(workbook: SheetRows, campusId: string, mode: ImportMode = "merge"): ImportSummary {
  const db = getDb();
  const now = nowIso();
  const summary: ImportSummary = {
    ok: true,
    mode,
    counts: {
      coursesCreated: 0, coursesUpdated: 0,
      subjectsCreated: 0, subjectsUpdated: 0,
      teachersCreated: 0, teachersUpdated: 0,
      requirementsCreated: 0, requirementsUpdated: 0,
      eligibilityCreated: 0,
      teacherAvailabilityRows: 0,
      courseAvailabilityRows: 0,
      projectsCreated: 0,
      forcedCreated: 0
    },
    detected: { courses: 0, subjects: 0, teachers: 0, requirements: 0, eligibility: 0, teacherAvailability: 0, courseAvailability: 0, projects: 0, forced: 0 },
    warnings: [],
    errors: []
  };

  // We always run validation. For `validate` mode we open a transaction and
  // rollback at the end so SQLite stays untouched but every code path executes.
  const dryRun = mode === "validate";
  const allowCreate = mode !== "update_existing";
  const allowUpdate = mode !== "create_missing";

  const tx = db.transaction(() => {
    if (mode === "replace_campus") {
      db.prepare("DELETE FROM schedule_assignments WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM conflicts WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM forced_assignments WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM project_teachers WHERE project_id IN (SELECT id FROM projects WHERE campus_id = ?)").run(campusId);
      db.prepare("DELETE FROM project_courses WHERE project_id IN (SELECT id FROM projects WHERE campus_id = ?)").run(campusId);
      db.prepare("DELETE FROM projects WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM teacher_subject_course_eligibility WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)").run(campusId);
      db.prepare("DELETE FROM teacher_subjects WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)").run(campusId);
      db.prepare("DELETE FROM teacher_course_eligibility WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)").run(campusId);
      db.prepare("DELETE FROM teacher_availability WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)").run(campusId);
      db.prepare("DELETE FROM course_availability WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)").run(campusId);
      db.prepare("DELETE FROM course_subject_requirements WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)").run(campusId);
      db.prepare("DELETE FROM teachers WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM courses WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM subjects WHERE campus_id = ?").run(campusId);
    }

    // Lookup maps
    const courseIdByKey = new Map<string, string>();
    const subjectIdByKey = new Map<string, string>();
    const teacherIdByKey = new Map<string, string>();
    for (const row of db.prepare("SELECT id, name FROM courses WHERE campus_id = ?").all(campusId) as Array<{ id: string; name: string }>) {
      courseIdByKey.set(normalizeKey(row.name), row.id);
    }
    for (const row of db.prepare("SELECT id, name FROM subjects WHERE campus_id = ?").all(campusId) as Array<{ id: string; name: string }>) {
      subjectIdByKey.set(normalizeKey(row.name), row.id);
    }
    for (const row of db.prepare("SELECT id, full_name FROM teachers WHERE campus_id = ?").all(campusId) as Array<{ id: string; full_name: string }>) {
      teacherIdByKey.set(normalizeKey(row.full_name), row.id);
    }

    type Block = { id: string; day_of_week: number; start_time: string; end_time: string; label: string; block_index: number | null; is_assignable: number };
    const blocks = db.prepare(
      "SELECT id, day_of_week, start_time, end_time, label, block_index, is_assignable FROM time_blocks WHERE campus_id = ?"
    ).all(campusId) as Block[];
    const blockByKey = new Map<string, Block>();
    for (const b of blocks) {
      blockByKey.set(`${b.day_of_week}|${b.start_time}`, b);
      blockByKey.set(`${b.day_of_week}|${normalizeKey(b.label)}`, b);
      if (b.block_index != null) blockByKey.set(`${b.day_of_week}|idx:${b.block_index}`, b);
    }
    const assignableBlocks = blocks.filter((b) => b.is_assignable === 1);

    function resolveBlock(day: number, start: string, end: string, blockIndex: string | null): Block | null {
      const sNorm = normalizeTime(start);
      if (sNorm) {
        const hit = blockByKey.get(`${day}|${sNorm}`);
        if (hit) return hit;
      }
      if (blockIndex) {
        const n = Number(blockIndex);
        if (Number.isFinite(n)) {
          const hit = blockByKey.get(`${day}|idx:${n}`);
          if (hit) return hit;
        }
      }
      if (start) {
        const hit = blockByKey.get(`${day}|${normalizeKey(start)}`);
        if (hit) return hit;
      }
      if (end) {
        const eNorm = normalizeTime(end);
        if (eNorm) {
          const list = assignableBlocks.filter((b) => b.day_of_week === day && b.end_time === eNorm);
          if (list.length === 1) return list[0];
        }
      }
      return null;
    }

    // Prepared statements
    const insertCourse = db.prepare(
      "INSERT INTO courses (id, campus_id, name, year, division, default_classroom_label, student_count, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,1,?,?)"
    );
    const updateCourse = db.prepare(
      "UPDATE courses SET year = COALESCE(?, year), division = COALESCE(?, division), default_classroom_label = COALESCE(?, default_classroom_label), student_count = COALESCE(?, student_count), updated_at = ? WHERE id = ?"
    );
    const insertSubject = db.prepare(
      "INSERT INTO subjects (id, campus_id, name, code, color, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,?,?)"
    );
    const updateSubject = db.prepare(
      "UPDATE subjects SET code = COALESCE(?, code), color = COALESCE(?, color), updated_at = ? WHERE id = ?"
    );
    const insertTeacher = db.prepare(
      "INSERT INTO teachers (id, campus_id, full_name, email, contractual_weekly_minutes, notes, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,1,?,?)"
    );
    const updateTeacher = db.prepare(
      "UPDATE teachers SET email = COALESCE(?, email), contractual_weekly_minutes = COALESCE(?, contractual_weekly_minutes), notes = COALESCE(?, notes), updated_at = ? WHERE id = ?"
    );
    const insertReq = db.prepare(
      "INSERT INTO course_subject_requirements (id, campus_id, course_id, subject_id, weekly_blocks_required, created_at, updated_at) VALUES (?,?,?,?,?,?,?)"
    );
    const updateReq = db.prepare(
      "UPDATE course_subject_requirements SET weekly_blocks_required = ?, updated_at = ? WHERE id = ?"
    );
    const selectReq = db.prepare("SELECT id FROM course_subject_requirements WHERE course_id = ? AND subject_id = ?");
    const insertMatrix = db.prepare(
      "INSERT OR IGNORE INTO teacher_subject_course_eligibility (id, teacher_id, subject_id, course_id, created_at, updated_at) VALUES (?,?,?,?,?,?)"
    );
    const insertLegacySubject = db.prepare(
      "INSERT OR IGNORE INTO teacher_subjects (id, teacher_id, subject_id, created_at) VALUES (?,?,?,?)"
    );
    const insertTeacherAvail = db.prepare(
      "INSERT OR REPLACE INTO teacher_availability (id, teacher_id, time_block_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?)"
    );
    const deleteTeacherAvail = db.prepare("DELETE FROM teacher_availability WHERE teacher_id = ?");
    const insertCourseAvail = db.prepare(
      "INSERT OR REPLACE INTO course_availability (id, course_id, time_block_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?)"
    );
    const deleteCourseAvail = db.prepare("DELETE FROM course_availability WHERE course_id = ?");
    const insertProject = db.prepare(
      "INSERT INTO projects (id, campus_id, name, type, description, fixed_time_block_id, weekly_blocks_required, flexible, notes, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?,?)"
    );
    const insertProjectTeacher = db.prepare(
      "INSERT OR IGNORE INTO project_teachers (id, project_id, teacher_id) VALUES (?,?,?)"
    );
    const insertProjectCourse = db.prepare(
      "INSERT OR IGNORE INTO project_courses (id, project_id, course_id) VALUES (?,?,?)"
    );
    const insertForced = db.prepare(
      "INSERT INTO forced_assignments (id, campus_id, course_id, subject_id, teacher_id, time_block_id, assignment_type, reason, hard_override, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?,?)"
    );

    function ensureCourse(name: string, year?: number | null, division?: string | null, classroom?: string | null, students?: number | null): string {
      const trimmed = name.replace(/\s+/g, " ").trim();
      if (!trimmed) return "";
      const key = normalizeKey(trimmed);
      const existing = courseIdByKey.get(key);
      if (existing) {
        if (allowUpdate) {
          updateCourse.run(year ?? null, division ?? null, classroom ?? null, students ?? null, now, existing);
          summary.counts.coursesUpdated += 1;
        }
        return existing;
      }
      if (!allowCreate) return "";
      const id = newId("crs");
      const m = trimmed.match(/^(\d+)\s*([A-Za-z]+)?$/);
      insertCourse.run(id, campusId, trimmed, year ?? (m ? Number(m[1]) : null), division ?? (m && m[2] ? m[2].toUpperCase() : null), classroom ?? `Aula ${trimmed}`, students ?? 28, now, now);
      courseIdByKey.set(key, id);
      summary.counts.coursesCreated += 1;
      return id;
    }
    function ensureSubject(name: string, code?: string | null, color?: string | null): string {
      const trimmed = name.replace(/\s+/g, " ").trim();
      if (!trimmed) return "";
      const key = normalizeKey(trimmed);
      const existing = subjectIdByKey.get(key);
      if (existing) {
        if (allowUpdate && (code || color)) {
          updateSubject.run(code ?? null, color ?? null, now, existing);
          summary.counts.subjectsUpdated += 1;
        }
        return existing;
      }
      if (!allowCreate) return "";
      const id = newId("sub");
      insertSubject.run(id, campusId, trimmed, code ?? trimmed.slice(0, 3).toUpperCase(), color ?? null, now, now);
      subjectIdByKey.set(key, id);
      summary.counts.subjectsCreated += 1;
      return id;
    }
    function ensureTeacher(name: string, email?: string | null, hours?: number | null, notes?: string | null): string {
      const trimmed = name.replace(/\s+/g, " ").trim();
      if (!trimmed) return "";
      const key = normalizeKey(trimmed);
      const existing = teacherIdByKey.get(key);
      if (existing) {
        if (allowUpdate) {
          updateTeacher.run(email ?? null, hours != null ? Math.round(hours * 60) : null, notes ?? null, now, existing);
          summary.counts.teachersUpdated += 1;
        }
        return existing;
      }
      if (!allowCreate) return "";
      const id = newId("tch");
      insertTeacher.run(id, campusId, trimmed, email ?? null, hours != null ? Math.round(hours * 60) : 0, notes ?? null, now, now);
      teacherIdByKey.set(key, id);
      summary.counts.teachersCreated += 1;
      return id;
    }

    // 1) Courses
    const sheetCourses = resolveSheet(workbook, "courses");
    if (sheetCourses) {
      summary.detected.courses = sheetCourses.length;
      const colName = pickColumn(Object.keys(sheetCourses[0] ?? {}), ["curso", "course", "nombre"]);
      const colYear = pickColumn(Object.keys(sheetCourses[0] ?? {}), ["año", "ano", "year"]);
      const colDiv = pickColumn(Object.keys(sheetCourses[0] ?? {}), ["division", "división"]);
      const colRoom = pickColumn(Object.keys(sheetCourses[0] ?? {}), ["aula base", "aula", "classroom"]);
      const colStu = pickColumn(Object.keys(sheetCourses[0] ?? {}), ["cantidad de estudiantes", "estudiantes", "students"]);
      if (!colName) summary.errors.push("Hoja Cursos: falta la columna 'Curso'.");
      for (const row of sheetCourses) {
        const name = rowVal(row, colName);
        if (!name) continue;
        const year = colYear ? Number(rowVal(row, colYear)) || null : null;
        const division = colDiv ? rowVal(row, colDiv) || null : null;
        const classroom = colRoom ? rowVal(row, colRoom) || null : null;
        const students = colStu ? Number(rowVal(row, colStu)) || null : null;
        ensureCourse(name, year, division, classroom, students);
      }
    }

    // 2) Subjects
    const sheetSubjects = resolveSheet(workbook, "subjects");
    if (sheetSubjects) {
      summary.detected.subjects = sheetSubjects.length;
      const colName = pickColumn(Object.keys(sheetSubjects[0] ?? {}), ["materia", "subject", "nombre"]);
      const colCode = pickColumn(Object.keys(sheetSubjects[0] ?? {}), ["codigo", "código", "code"]);
      const colColor = pickColumn(Object.keys(sheetSubjects[0] ?? {}), ["color"]);
      if (!colName) summary.errors.push("Hoja Materias: falta la columna 'Materia'.");
      for (const row of sheetSubjects) {
        const name = rowVal(row, colName);
        if (!name) continue;
        ensureSubject(name, rowVal(row, colCode) || null, rowVal(row, colColor) || null);
      }
    }

    // 3) Teachers
    const sheetTeachers = resolveSheet(workbook, "teachers");
    if (sheetTeachers) {
      summary.detected.teachers = sheetTeachers.length;
      const colName = pickColumn(Object.keys(sheetTeachers[0] ?? {}), ["docente", "teacher", "profesor", "nombre", "full name"]);
      const colEmail = pickColumn(Object.keys(sheetTeachers[0] ?? {}), ["email", "correo"]);
      const colHours = pickColumn(Object.keys(sheetTeachers[0] ?? {}), [
        "carga contractual semanal", "carga horaria contractual", "horas contractuales",
        "weekly hours", "contractual hours", "carga", "horas semanales", "horas"
      ]);
      const colNotes = pickColumn(Object.keys(sheetTeachers[0] ?? {}), ["notas", "notes"]);
      if (!colName) summary.errors.push("Hoja Docentes: falta la columna 'Docente'.");
      for (const row of sheetTeachers) {
        const name = rowVal(row, colName);
        if (!name) continue;
        const hoursRaw = colHours ? rowVal(row, colHours) : "";
        const hours = hoursRaw ? Number(hoursRaw.replace(",", ".")) : null;
        ensureTeacher(name, rowVal(row, colEmail) || null, Number.isFinite(hours as number) ? (hours as number) : null, rowVal(row, colNotes) || null);
        if (!hoursRaw) summary.warnings.push(`Docente sin carga contractual: ${name}.`);
      }
    }

    // 4) Course-subject requirements
    const sheetReq = resolveSheet(workbook, "requirements");
    if (sheetReq) {
      summary.detected.requirements = sheetReq.length;
      const colCourse = pickColumn(Object.keys(sheetReq[0] ?? {}), ["curso", "course"]);
      const colSubject = pickColumn(Object.keys(sheetReq[0] ?? {}), ["materia", "subject"]);
      const colHours = pickColumn(Object.keys(sheetReq[0] ?? {}), ["horas semanales", "horas", "weekly hours", "blocks"]);
      if (!colCourse || !colSubject || !colHours) summary.errors.push("Hoja Carga por curso: faltan columnas Curso, Materia u Horas semanales.");
      else {
        for (const row of sheetReq) {
          const cName = rowVal(row, colCourse);
          const sName = rowVal(row, colSubject);
          if (!cName || !sName) continue;
          const hours = Number(rowVal(row, colHours));
          if (!Number.isFinite(hours) || hours <= 0) continue;
          const courseId = ensureCourse(cName);
          const subjectId = ensureSubject(sName);
          if (!courseId || !subjectId) continue;
          const existing = selectReq.get(courseId, subjectId) as { id: string } | undefined;
          if (existing) {
            updateReq.run(Math.round(hours), now, existing.id);
            summary.counts.requirementsUpdated += 1;
          } else {
            insertReq.run(newId("csr"), campusId, courseId, subjectId, Math.round(hours), now, now);
            summary.counts.requirementsCreated += 1;
          }
        }
      }
    }

    // 5) Eligibility matrix
    const sheetMatrix = resolveSheet(workbook, "matrix");
    if (sheetMatrix) {
      summary.detected.eligibility = sheetMatrix.length;
      const colT = pickColumn(Object.keys(sheetMatrix[0] ?? {}), ["docente", "teacher"]);
      const colS = pickColumn(Object.keys(sheetMatrix[0] ?? {}), ["materia", "subject"]);
      const colC = pickColumn(Object.keys(sheetMatrix[0] ?? {}), ["curso", "course"]);
      if (!colT || !colS || !colC) summary.errors.push("Hoja Habilitaciones: faltan columnas Docente, Materia o Curso.");
      else {
        for (const row of sheetMatrix) {
          const t = rowVal(row, colT); const s = rowVal(row, colS); const c = rowVal(row, colC);
          if (!t || !s || !c) continue;
          const teacherId = ensureTeacher(t);
          const subjectId = ensureSubject(s);
          const courseId = ensureCourse(c);
          if (!teacherId || !subjectId || !courseId) continue;
          const result = insertMatrix.run(newId("tsce"), teacherId, subjectId, courseId, now, now);
          if (result.changes > 0) {
            summary.counts.eligibilityCreated += 1;
            insertLegacySubject.run(newId("ts"), teacherId, subjectId, now);
          }
        }
      }
    }

    // 6) Teacher availability
    const sheetTeacherAvail = resolveSheet(workbook, "teacherAvailability");
    type Avail = { day: number; key: string; end: string; blockIdx: string | null; status: "AVAILABLE" | "UNAVAILABLE" };
    if (sheetTeacherAvail) {
      summary.detected.teacherAvailability = sheetTeacherAvail.length;
      const colT = pickColumn(Object.keys(sheetTeacherAvail[0] ?? {}), ["docente", "teacher"]);
      const colD = pickColumn(Object.keys(sheetTeacherAvail[0] ?? {}), ["dia", "día", "day"]);
      const colStart = pickColumn(Object.keys(sheetTeacherAvail[0] ?? {}), ["inicio", "start", "start time"]);
      const colEnd = pickColumn(Object.keys(sheetTeacherAvail[0] ?? {}), ["fin", "end", "end time"]);
      const colIdx = pickColumn(Object.keys(sheetTeacherAvail[0] ?? {}), ["bloque", "block"]);
      const colStatus = pickColumn(Object.keys(sheetTeacherAvail[0] ?? {}), ["estado", "status", "availability"]);
      if (!colT || !colD || (!colStart && !colIdx)) {
        summary.errors.push("Hoja Disponibilidad docentes: faltan columnas Docente, Día o Inicio/Bloque.");
      } else {
        const grouped = new Map<string, { teacherName: string; rows: Avail[] }>();
        for (const row of sheetTeacherAvail) {
          const teacherName = rowVal(row, colT);
          const day = resolveDay(rowVal(row, colD));
          if (!teacherName || day === null) continue;
          grouped.get(teacherName) ?? grouped.set(teacherName, { teacherName, rows: [] });
          const bucket = grouped.get(teacherName)!;
          bucket.rows.push({
            day,
            key: colStart ? rowVal(row, colStart) : "",
            end: colEnd ? rowVal(row, colEnd) : "",
            blockIdx: colIdx ? rowVal(row, colIdx) || null : null,
            status: resolveStatus(colStatus ? rowVal(row, colStatus) : "AVAILABLE")
          });
        }
        for (const bucket of grouped.values()) {
          const teacherId = ensureTeacher(bucket.teacherName);
          if (!teacherId) continue;
          deleteTeacherAvail.run(teacherId);
          for (const a of bucket.rows) {
            const block = resolveBlock(a.day, a.key, a.end, a.blockIdx);
            if (!block || !block.is_assignable) {
              summary.warnings.push(`Bloque no encontrado para ${bucket.teacherName} (día ${a.day}, inicio "${a.key}").`);
              continue;
            }
            insertTeacherAvail.run(newId("ta"), teacherId, block.id, a.status, now, now);
            summary.counts.teacherAvailabilityRows += 1;
          }
        }
      }
    }

    // 7) Course availability
    const sheetCourseAvail = resolveSheet(workbook, "courseAvailability");
    if (sheetCourseAvail) {
      summary.detected.courseAvailability = sheetCourseAvail.length;
      const colC = pickColumn(Object.keys(sheetCourseAvail[0] ?? {}), ["curso", "course"]);
      const colD = pickColumn(Object.keys(sheetCourseAvail[0] ?? {}), ["dia", "día", "day"]);
      const colStart = pickColumn(Object.keys(sheetCourseAvail[0] ?? {}), ["inicio", "start"]);
      const colEnd = pickColumn(Object.keys(sheetCourseAvail[0] ?? {}), ["fin", "end"]);
      const colIdx = pickColumn(Object.keys(sheetCourseAvail[0] ?? {}), ["bloque", "block"]);
      const colStatus = pickColumn(Object.keys(sheetCourseAvail[0] ?? {}), ["estado", "status"]);
      if (!colC || !colD || (!colStart && !colIdx)) summary.errors.push("Hoja Disponibilidad cursos: faltan columnas Curso, Día o Inicio/Bloque.");
      else {
        const grouped = new Map<string, { courseName: string; rows: Avail[] }>();
        for (const row of sheetCourseAvail) {
          const courseName = rowVal(row, colC);
          const day = resolveDay(rowVal(row, colD));
          if (!courseName || day === null) continue;
          grouped.get(courseName) ?? grouped.set(courseName, { courseName, rows: [] });
          const bucket = grouped.get(courseName)!;
          bucket.rows.push({
            day,
            key: colStart ? rowVal(row, colStart) : "",
            end: colEnd ? rowVal(row, colEnd) : "",
            blockIdx: colIdx ? rowVal(row, colIdx) || null : null,
            status: resolveStatus(colStatus ? rowVal(row, colStatus) : "AVAILABLE")
          });
        }
        for (const bucket of grouped.values()) {
          const courseId = ensureCourse(bucket.courseName);
          if (!courseId) continue;
          deleteCourseAvail.run(courseId);
          for (const a of bucket.rows) {
            const block = resolveBlock(a.day, a.key, a.end, a.blockIdx);
            if (!block || !block.is_assignable) {
              summary.warnings.push(`Bloque no encontrado para curso ${bucket.courseName} (día ${a.day}, inicio "${a.key}").`);
              continue;
            }
            insertCourseAvail.run(newId("ca"), courseId, block.id, a.status, now, now);
            summary.counts.courseAvailabilityRows += 1;
          }
        }
      }
    }

    // 8) Projects
    const sheetProjects = resolveSheet(workbook, "projects");
    if (sheetProjects) {
      summary.detected.projects = sheetProjects.length;
      const colName = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["proyecto", "name"]);
      const colType = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["tipo", "type"]);
      const colCourses = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["cursos", "courses"]);
      const colTeachers = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["docentes", "teachers"]);
      const colHours = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["horas semanales", "horas", "weekly hours"]);
      const colDay = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["dia fijo", "día fijo", "day"]);
      const colStart = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["inicio fijo", "inicio", "start"]);
      const colEnd = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["fin fijo", "fin", "end"]);
      const colIdx = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["bloque fijo", "bloque", "block"]);
      const colNotes = pickColumn(Object.keys(sheetProjects[0] ?? {}), ["notas", "notes", "descripcion", "descripción", "description"]);
      const typeMap: Record<string, string> = {
        proyecto: "PROJECT", project: "PROJECT",
        electiva: "ELECTIVE", elective: "ELECTIVE",
        optativa: "OPTATIVE", optative: "OPTATIVE",
        taller: "WORKSHOP", workshop: "WORKSHOP",
        ciudadanos: "CITIZENSHIP", citizenship: "CITIZENSHIP",
        interdisciplinario: "INTERDISCIPLINARY", interdisciplinary: "INTERDISCIPLINARY"
      };
      for (const row of sheetProjects) {
        const name = rowVal(row, colName);
        if (!name) continue;
        const type = typeMap[normalizeKey(rowVal(row, colType))] ?? "PROJECT";
        const hours = Math.max(1, Math.round(Number(rowVal(row, colHours)) || 1));
        const day = colDay ? resolveDay(rowVal(row, colDay)) : null;
        const start = colStart ? rowVal(row, colStart) : "";
        const end = colEnd ? rowVal(row, colEnd) : "";
        const idx = colIdx ? rowVal(row, colIdx) || null : null;
        const fixedBlock = day != null && (start || idx) ? resolveBlock(day, start, end, idx) : null;
        const projectId = newId("prj");
        insertProject.run(projectId, campusId, name, type, rowVal(row, colNotes) || null, fixedBlock?.id ?? null, hours, fixedBlock ? 0 : 1, rowVal(row, colNotes) || null, now, now);
        summary.counts.projectsCreated += 1;
        const courseNames = (rowVal(row, colCourses) || "").split(",").map((s) => s.trim()).filter(Boolean);
        for (const cn of courseNames) {
          const id = ensureCourse(cn);
          if (id) insertProjectCourse.run(newId("pc"), projectId, id);
        }
        const teacherNames = (rowVal(row, colTeachers) || "").split(",").map((s) => s.trim()).filter(Boolean);
        for (const tn of teacherNames) {
          const id = ensureTeacher(tn);
          if (id) insertProjectTeacher.run(newId("pt"), projectId, id);
        }
      }
    }

    // 9) Forced assignments
    const sheetForced = resolveSheet(workbook, "forced");
    if (sheetForced) {
      summary.detected.forced = sheetForced.length;
      const colC = pickColumn(Object.keys(sheetForced[0] ?? {}), ["curso", "course"]);
      const colS = pickColumn(Object.keys(sheetForced[0] ?? {}), ["materia", "subject"]);
      const colT = pickColumn(Object.keys(sheetForced[0] ?? {}), ["docente", "teacher"]);
      const colD = pickColumn(Object.keys(sheetForced[0] ?? {}), ["dia", "día", "day"]);
      const colStart = pickColumn(Object.keys(sheetForced[0] ?? {}), ["inicio", "start"]);
      const colEnd = pickColumn(Object.keys(sheetForced[0] ?? {}), ["fin", "end"]);
      const colIdx = pickColumn(Object.keys(sheetForced[0] ?? {}), ["bloque", "block"]);
      const colType = pickColumn(Object.keys(sheetForced[0] ?? {}), ["tipo", "type"]);
      const colReason = pickColumn(Object.keys(sheetForced[0] ?? {}), ["motivo", "reason"]);
      for (const row of sheetForced) {
        const day = colD ? resolveDay(rowVal(row, colD)) : null;
        if (day === null) continue;
        const block = resolveBlock(day, colStart ? rowVal(row, colStart) : "", colEnd ? rowVal(row, colEnd) : "", colIdx ? rowVal(row, colIdx) || null : null);
        if (!block) { summary.warnings.push(`Forzado: bloque no encontrado (día ${day}).`); continue; }
        const courseId = colC ? ensureCourse(rowVal(row, colC)) : "";
        const subjectId = colS ? ensureSubject(rowVal(row, colS)) : "";
        const teacherId = colT ? ensureTeacher(rowVal(row, colT)) : "";
        const type = (rowVal(row, colType) || "REGULAR_CLASS").toUpperCase();
        insertForced.run(newId("fa"), campusId, courseId || null, subjectId || null, teacherId || null, block.id, type, rowVal(row, colReason) || null, 0, now, now);
        summary.counts.forcedCreated += 1;
      }
    }

    // 10) Default course availability if missing
    if (!sheetCourseAvail) {
      const courses = db.prepare("SELECT id, name FROM courses WHERE campus_id = ? AND is_active = 1").all(campusId) as Array<{ id: string; name: string }>;
      for (const c of courses) {
        const hasAny = (db.prepare("SELECT 1 FROM course_availability WHERE course_id = ? LIMIT 1").get(c.id) as unknown) ?? null;
        if (hasAny) continue;
        for (const b of assignableBlocks) {
          insertCourseAvail.run(newId("ca"), c.id, b.id, "AVAILABLE", now, now);
          summary.counts.courseAvailabilityRows += 1;
        }
      }
      summary.warnings.push("Disponibilidad de cursos creada por defecto (todos los bloques asignables).");
    }

    // Final warnings driven by SQLite state
    const noLoad = db.prepare(
      "SELECT full_name FROM teachers WHERE campus_id = ? AND is_active = 1 AND (contractual_weekly_minutes IS NULL OR contractual_weekly_minutes = 0)"
    ).all(campusId) as Array<{ full_name: string }>;
    for (const t of noLoad) summary.warnings.push(`Docente sin carga contractual: ${t.full_name}.`);
    const noReq = db.prepare(
      "SELECT name FROM courses WHERE campus_id = ? AND is_active = 1 AND NOT EXISTS (SELECT 1 FROM course_subject_requirements WHERE course_id = courses.id)"
    ).all(campusId) as Array<{ name: string }>;
    for (const c of noReq) summary.warnings.push(`Curso sin materias requeridas: ${c.name}.`);
    const noAvail = db.prepare(
      "SELECT full_name FROM teachers WHERE campus_id = ? AND is_active = 1 AND NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = teachers.id)"
    ).all(campusId) as Array<{ full_name: string }>;
    for (const t of noAvail) summary.warnings.push(`Docente sin disponibilidad: ${t.full_name}.`);

    if (dryRun) {
      // Rollback by throwing; caller catches and treats summary.ok = true.
      throw new RollbackForValidate();
    }
  });

  class RollbackForValidate extends Error {}
  try {
    tx();
  } catch (err) {
    if (!(err instanceof RollbackForValidate)) {
      summary.ok = false;
      summary.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (summary.errors.length > 0) summary.ok = false;
  return summary;
}
