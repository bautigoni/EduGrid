import { getDb, newId, nowIso } from "@/lib/db";

export type AvailabilityStatus = "AVAILABLE" | "UNAVAILABLE";

export function getTeacherAvailability(teacherId: string): Array<{ time_block_id: string; status: AvailabilityStatus }> {
  return getDb()
    .prepare("SELECT time_block_id, status FROM teacher_availability WHERE teacher_id = ?")
    .all(teacherId) as Array<{ time_block_id: string; status: AvailabilityStatus }>;
}

export function saveTeacherAvailability(teacherId: string, entries: Array<{ time_block_id: string; status: AvailabilityStatus }>) {
  const db = getDb();
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM teacher_availability WHERE teacher_id = ?").run(teacherId);
    const insert = db.prepare(`INSERT INTO teacher_availability
      (id, teacher_id, time_block_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?)`);
    for (const e of entries) {
      insert.run(newId("tav"), teacherId, e.time_block_id, e.status, now, now);
    }
  });
  tx();
}

export function getCourseAvailability(courseId: string): Array<{ time_block_id: string; status: AvailabilityStatus }> {
  return getDb()
    .prepare("SELECT time_block_id, status FROM course_availability WHERE course_id = ?")
    .all(courseId) as Array<{ time_block_id: string; status: AvailabilityStatus }>;
}

export function saveCourseAvailability(courseId: string, entries: Array<{ time_block_id: string; status: AvailabilityStatus }>) {
  const db = getDb();
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM course_availability WHERE course_id = ?").run(courseId);
    const insert = db.prepare(`INSERT INTO course_availability
      (id, course_id, time_block_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?)`);
    for (const e of entries) {
      insert.run(newId("cav"), courseId, e.time_block_id, e.status, now, now);
    }
  });
  tx();
}
