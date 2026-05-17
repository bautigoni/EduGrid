import { getDb, newId, nowIso } from "@/lib/db";

export type DbUser = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function getUserByEmail(email: string): DbUser | null {
  return (getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as DbUser | undefined) ?? null;
}

export function getUserById(id: string): DbUser | null {
  return (getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser | undefined) ?? null;
}

export function createUser(data: { full_name: string; email: string; password_hash: string; role: string; status?: string }): DbUser {
  const db = getDb();
  const now = nowIso();
  const id = newId("usr");
  db.prepare(`INSERT INTO users (id, full_name, email, password_hash, role, status, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, data.full_name, data.email, data.password_hash, data.role, data.status ?? "ACTIVE", now, now);
  return getUserById(id)!;
}

export function assignUserToCampus(userId: string, campusId: string) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO user_campuses (id, user_id, campus_id, created_at) VALUES (?,?,?,?)`)
    .run(newId("uc"), userId, campusId, nowIso());
}

export function getUserCampuses(userId: string): string[] {
  return (getDb()
    .prepare("SELECT campus_id FROM user_campuses WHERE user_id = ?")
    .all(userId) as { campus_id: string }[]).map((r) => r.campus_id);
}
