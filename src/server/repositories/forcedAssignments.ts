import { getDb, newId, nowIso } from "@/lib/db";

export type ForcedAssignment = {
  id: string;
  campus_id: string;
  course_id: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  time_block_id: string;
  assignment_type: string;
  reason: string | null;
  hard_override: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export function getForcedAssignmentsByCampus(campusId: string): ForcedAssignment[] {
  return getDb()
    .prepare("SELECT * FROM forced_assignments WHERE campus_id = ? AND is_active = 1 ORDER BY created_at DESC")
    .all(campusId) as ForcedAssignment[];
}

export function getForcedAssignmentById(id: string, campusId: string): ForcedAssignment | null {
  return (getDb().prepare("SELECT * FROM forced_assignments WHERE id = ? AND campus_id = ?").get(id, campusId) as ForcedAssignment | undefined) ?? null;
}

export type ForcedAssignmentInput = {
  course_id?: string | null;
  subject_id?: string | null;
  teacher_id?: string | null;
  time_block_id: string;
  assignment_type: string;
  reason?: string;
  hard_override?: boolean;
};

export function createForcedAssignment(campusId: string, data: ForcedAssignmentInput): ForcedAssignment {
  const db = getDb();
  const now = nowIso();
  const id = newId("fa");
  db.prepare(
    `INSERT INTO forced_assignments
      (id, campus_id, course_id, subject_id, teacher_id, time_block_id, assignment_type, reason, hard_override, is_active, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,1,?,?)`
  ).run(
    id,
    campusId,
    data.course_id ?? null,
    data.subject_id ?? null,
    data.teacher_id ?? null,
    data.time_block_id,
    data.assignment_type,
    data.reason ?? null,
    data.hard_override ? 1 : 0,
    now,
    now
  );
  return getForcedAssignmentById(id, campusId)!;
}

export function deleteForcedAssignment(id: string, campusId: string) {
  getDb().prepare("UPDATE forced_assignments SET is_active = 0, updated_at = ? WHERE id = ? AND campus_id = ?").run(nowIso(), id, campusId);
}
