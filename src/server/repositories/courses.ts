import { getDb, newId, nowIso } from "@/lib/db";

export type Course = {
  id: string;
  campus_id: string;
  name: string;
  year: number | null;
  division: string | null;
  default_classroom_label: string | null;
  student_count: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type CourseSubjectRequirement = {
  id: string;
  campus_id: string;
  course_id: string;
  subject_id: string;
  weekly_blocks_required: number;
  weekly_minutes_required: number | null;
};

export function getCoursesByCampus(campusId: string): Course[] {
  return getDb().prepare("SELECT * FROM courses WHERE campus_id = ? AND is_active = 1 ORDER BY year, division, name").all(campusId) as Course[];
}

export function getCourseById(id: string, campusId: string): Course | null {
  return (getDb().prepare("SELECT * FROM courses WHERE id = ? AND campus_id = ?").get(id, campusId) as Course | undefined) ?? null;
}

export function createCourse(campusId: string, data: { name: string; year?: number; division?: string; default_classroom_label?: string; student_count?: number }) {
  const db = getDb();
  const now = nowIso();
  const id = newId("crs");
  db.prepare(`INSERT INTO courses (id, campus_id, name, year, division, default_classroom_label, student_count, is_active, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,1,?,?)`)
    .run(id, campusId, data.name, data.year ?? null, data.division ?? null,
      data.default_classroom_label ?? `Aula ${data.name}`, data.student_count ?? null, now, now);
  return getCourseById(id, campusId)!;
}

export function updateCourse(id: string, campusId: string, data: Partial<Pick<Course, "name" | "year" | "division" | "default_classroom_label" | "student_count">>) {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (!fields.length) return getCourseById(id, campusId);
  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(id);
  values.push(campusId);
  db.prepare(`UPDATE courses SET ${fields.join(", ")} WHERE id = ? AND campus_id = ?`).run(...values);
  return getCourseById(id, campusId);
}

export function archiveCourse(id: string, campusId: string) {
  getDb().prepare("UPDATE courses SET is_active = 0, updated_at = ? WHERE id = ? AND campus_id = ?").run(nowIso(), id, campusId);
}

export function getCourseSubjectRequirements(courseId: string): CourseSubjectRequirement[] {
  return getDb().prepare("SELECT * FROM course_subject_requirements WHERE course_id = ? ORDER BY created_at").all(courseId) as CourseSubjectRequirement[];
}

export function saveCourseSubjectRequirements(
  campusId: string,
  courseId: string,
  requirements: Array<{ subject_id: string; weekly_blocks_required: number; weekly_minutes_required?: number }>
) {
  const db = getDb();
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM course_subject_requirements WHERE course_id = ?").run(courseId);
    const insert = db.prepare(`INSERT INTO course_subject_requirements
      (id, campus_id, course_id, subject_id, weekly_blocks_required, weekly_minutes_required, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?)`);
    for (const r of requirements) {
      insert.run(newId("csr"), campusId, courseId, r.subject_id, r.weekly_blocks_required, r.weekly_minutes_required ?? null, now, now);
    }
  });
  tx();
}
