import { getDb, newId, nowIso } from "@/lib/db";

export type Teacher = {
  id: string;
  campus_id: string;
  full_name: string;
  email: string | null;
  contractual_weekly_minutes: number;
  allow_institutional_hours: number;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export function getTeachersByCampus(campusId: string): Teacher[] {
  return getDb().prepare("SELECT * FROM teachers WHERE campus_id = ? AND is_active = 1 ORDER BY full_name").all(campusId) as Teacher[];
}

export function getTeacherById(id: string, campusId: string): Teacher | null {
  return (getDb().prepare("SELECT * FROM teachers WHERE id = ? AND campus_id = ?").get(id, campusId) as Teacher | undefined) ?? null;
}

export function createTeacher(campusId: string, data: { full_name: string; email?: string; contractual_weekly_minutes?: number; allow_institutional_hours?: boolean; notes?: string }) {
  const db = getDb();
  const now = nowIso();
  const id = newId("tch");
  db.prepare(`INSERT INTO teachers (id, campus_id, full_name, email, contractual_weekly_minutes, allow_institutional_hours, notes, is_active, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,1,?,?)`)
    .run(id, campusId, data.full_name, data.email ?? null, data.contractual_weekly_minutes ?? 0,
      data.allow_institutional_hours === false ? 0 : 1, data.notes ?? null, now, now);
  return getTeacherById(id, campusId)!;
}

export function updateTeacher(id: string, campusId: string, data: Partial<Pick<Teacher, "full_name" | "email" | "contractual_weekly_minutes" | "allow_institutional_hours" | "notes">>) {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (!fields.length) return getTeacherById(id, campusId);
  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(id);
  values.push(campusId);
  db.prepare(`UPDATE teachers SET ${fields.join(", ")} WHERE id = ? AND campus_id = ?`).run(...values);
  return getTeacherById(id, campusId);
}

export function archiveTeacher(id: string, campusId: string) {
  getDb().prepare("UPDATE teachers SET is_active = 0, updated_at = ? WHERE id = ? AND campus_id = ?").run(nowIso(), id, campusId);
}

export function getTeacherSubjectIds(teacherId: string): string[] {
  return (getDb().prepare("SELECT subject_id FROM teacher_subjects WHERE teacher_id = ?").all(teacherId) as { subject_id: string }[]).map((r) => r.subject_id);
}

export function saveTeacherSubjects(teacherId: string, subjectIds: string[]) {
  const db = getDb();
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM teacher_subjects WHERE teacher_id = ?").run(teacherId);
    const insert = db.prepare("INSERT INTO teacher_subjects (id, teacher_id, subject_id, created_at) VALUES (?,?,?,?)");
    for (const sid of subjectIds) {
      insert.run(newId("ts"), teacherId, sid, now);
    }
  });
  tx();
}

export function getTeacherCourseEligibility(teacherId: string): string[] {
  return (getDb().prepare("SELECT course_id FROM teacher_course_eligibility WHERE teacher_id = ?").all(teacherId) as { course_id: string }[]).map((r) => r.course_id);
}

export type EligibilityCell = { subject_id: string; course_id: string };

export function getTeacherEligibilityMatrix(teacherId: string): EligibilityCell[] {
  return getDb()
    .prepare("SELECT subject_id, course_id FROM teacher_subject_course_eligibility WHERE teacher_id = ?")
    .all(teacherId) as EligibilityCell[];
}

export function saveTeacherEligibilityMatrix(teacherId: string, cells: EligibilityCell[]) {
  const db = getDb();
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM teacher_subject_course_eligibility WHERE teacher_id = ?").run(teacherId);
    const insert = db.prepare(
      "INSERT OR IGNORE INTO teacher_subject_course_eligibility (id, teacher_id, subject_id, course_id, created_at, updated_at) VALUES (?,?,?,?,?,?)"
    );
    for (const cell of cells) {
      if (!cell.subject_id || !cell.course_id) continue;
      insert.run(newId("tsce"), teacherId, cell.subject_id, cell.course_id, now, now);
    }
    // Keep the legacy helper tables in sync so the older UI still reflects
    // something sensible while the migration finishes.
    db.prepare("DELETE FROM teacher_subjects WHERE teacher_id = ?").run(teacherId);
    db.prepare("DELETE FROM teacher_course_eligibility WHERE teacher_id = ?").run(teacherId);
    const distinctSubjects = new Set(cells.map((c) => c.subject_id));
    const distinctCourses = new Set(cells.map((c) => c.course_id));
    const sIns = db.prepare("INSERT OR IGNORE INTO teacher_subjects (id, teacher_id, subject_id, created_at) VALUES (?,?,?,?)");
    const cIns = db.prepare("INSERT OR IGNORE INTO teacher_course_eligibility (id, teacher_id, course_id, created_at) VALUES (?,?,?,?)");
    for (const sid of distinctSubjects) sIns.run(newId("ts"), teacherId, sid, now);
    for (const cid of distinctCourses) cIns.run(newId("tce"), teacherId, cid, now);
  });
  tx();
}

export function saveTeacherCourseEligibility(teacherId: string, courseIds: string[]) {
  const db = getDb();
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM teacher_course_eligibility WHERE teacher_id = ?").run(teacherId);
    const insert = db.prepare("INSERT INTO teacher_course_eligibility (id, teacher_id, course_id, created_at) VALUES (?,?,?,?)");
    for (const cid of courseIds) {
      insert.run(newId("tce"), teacherId, cid, now);
    }
  });
  tx();
}
