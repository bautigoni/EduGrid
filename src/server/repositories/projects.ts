import { getDb, newId, nowIso } from "@/lib/db";

export type Project = {
  id: string;
  campus_id: string;
  name: string;
  type: string; // PROJECT | ELECTIVE | OPTATIVE | WORKSHOP | CITIZENSHIP | INTERDISCIPLINARY
  description: string | null;
  fixed_time_block_id: string | null;
  weekly_blocks_required: number;
  flexible: number;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type ProjectWithMembers = Project & {
  teacher_ids: string[];
  course_ids: string[];
};

export function getProjectsByCampus(campusId: string): ProjectWithMembers[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM projects WHERE campus_id = ? AND is_active = 1 ORDER BY created_at DESC").all(campusId) as Project[];
  return rows.map((row) => ({
    ...row,
    teacher_ids: (db.prepare("SELECT teacher_id FROM project_teachers WHERE project_id = ?").all(row.id) as { teacher_id: string }[]).map((r) => r.teacher_id),
    course_ids: (db.prepare("SELECT course_id FROM project_courses WHERE project_id = ?").all(row.id) as { course_id: string }[]).map((r) => r.course_id)
  }));
}

export function getProjectById(id: string, campusId: string): ProjectWithMembers | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ? AND campus_id = ?").get(id, campusId) as Project | undefined;
  if (!row) return null;
  return {
    ...row,
    teacher_ids: (db.prepare("SELECT teacher_id FROM project_teachers WHERE project_id = ?").all(row.id) as { teacher_id: string }[]).map((r) => r.teacher_id),
    course_ids: (db.prepare("SELECT course_id FROM project_courses WHERE project_id = ?").all(row.id) as { course_id: string }[]).map((r) => r.course_id)
  };
}

export type ProjectInput = {
  name: string;
  type: string;
  description?: string;
  fixed_time_block_id?: string | null;
  weekly_blocks_required?: number;
  flexible?: boolean;
  notes?: string;
  teacher_ids?: string[];
  course_ids?: string[];
};

export function createProject(campusId: string, data: ProjectInput): ProjectWithMembers {
  const db = getDb();
  const now = nowIso();
  const id = newId("prj");
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO projects
      (id, campus_id, name, type, description, fixed_time_block_id, weekly_blocks_required, flexible, notes, is_active, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,1,?,?)`)
      .run(id, campusId, data.name, data.type, data.description ?? null, data.fixed_time_block_id ?? null,
        Math.max(1, data.weekly_blocks_required ?? 1), data.flexible === false ? 0 : 1, data.notes ?? null, now, now);
    for (const tid of data.teacher_ids ?? []) {
      db.prepare("INSERT OR IGNORE INTO project_teachers (id, project_id, teacher_id) VALUES (?,?,?)").run(newId("pt"), id, tid);
    }
    for (const cid of data.course_ids ?? []) {
      db.prepare("INSERT OR IGNORE INTO project_courses (id, project_id, course_id) VALUES (?,?,?)").run(newId("pc"), id, cid);
    }
  });
  tx();
  return getProjectById(id, campusId)!;
}

export function updateProject(id: string, campusId: string, data: ProjectInput): ProjectWithMembers | null {
  const db = getDb();
  const now = nowIso();
  const existing = getProjectById(id, campusId);
  if (!existing) return null;
  const tx = db.transaction(() => {
    db.prepare(`UPDATE projects SET name = ?, type = ?, description = ?, fixed_time_block_id = ?, weekly_blocks_required = ?, flexible = ?, notes = ?, updated_at = ?
                WHERE id = ? AND campus_id = ?`)
      .run(
        data.name ?? existing.name,
        data.type ?? existing.type,
        data.description ?? existing.description,
        data.fixed_time_block_id ?? existing.fixed_time_block_id,
        data.weekly_blocks_required ?? existing.weekly_blocks_required,
        data.flexible === false ? 0 : 1,
        data.notes ?? existing.notes,
        now,
        id,
        campusId
      );
    if (data.teacher_ids) {
      db.prepare("DELETE FROM project_teachers WHERE project_id = ?").run(id);
      for (const tid of data.teacher_ids) {
        db.prepare("INSERT OR IGNORE INTO project_teachers (id, project_id, teacher_id) VALUES (?,?,?)").run(newId("pt"), id, tid);
      }
    }
    if (data.course_ids) {
      db.prepare("DELETE FROM project_courses WHERE project_id = ?").run(id);
      for (const cid of data.course_ids) {
        db.prepare("INSERT OR IGNORE INTO project_courses (id, project_id, course_id) VALUES (?,?,?)").run(newId("pc"), id, cid);
      }
    }
  });
  tx();
  return getProjectById(id, campusId);
}

export function archiveProject(id: string, campusId: string) {
  getDb().prepare("UPDATE projects SET is_active = 0, updated_at = ? WHERE id = ? AND campus_id = ?").run(nowIso(), id, campusId);
}
