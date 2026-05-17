import { getDb, newId, nowIso } from "@/lib/db";

export type Subject = {
  id: string;
  campus_id: string;
  name: string;
  code: string | null;
  color: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export function getSubjectsByCampus(campusId: string): Subject[] {
  return getDb().prepare("SELECT * FROM subjects WHERE campus_id = ? AND is_active = 1 ORDER BY name").all(campusId) as Subject[];
}

export function getSubjectById(id: string, campusId: string): Subject | null {
  return (getDb().prepare("SELECT * FROM subjects WHERE id = ? AND campus_id = ?").get(id, campusId) as Subject | undefined) ?? null;
}

export function createSubject(campusId: string, data: { name: string; code?: string; color?: string; notes?: string }) {
  const db = getDb();
  const now = nowIso();
  const id = newId("sub");
  db.prepare(`INSERT INTO subjects (id, campus_id, name, code, color, notes, is_active, created_at, updated_at)
              VALUES (?,?,?,?,?,?,1,?,?)`)
    .run(id, campusId, data.name, data.code ?? null, data.color ?? "#FDBA74", data.notes ?? null, now, now);
  return getSubjectById(id, campusId)!;
}

export function updateSubject(id: string, campusId: string, data: Partial<Pick<Subject, "name" | "code" | "color" | "notes">>) {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (!fields.length) return getSubjectById(id, campusId);
  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(id);
  values.push(campusId);
  db.prepare(`UPDATE subjects SET ${fields.join(", ")} WHERE id = ? AND campus_id = ?`).run(...values);
  return getSubjectById(id, campusId);
}

export function archiveSubject(id: string, campusId: string) {
  getDb().prepare("UPDATE subjects SET is_active = 0, updated_at = ? WHERE id = ? AND campus_id = ?").run(nowIso(), id, campusId);
}
