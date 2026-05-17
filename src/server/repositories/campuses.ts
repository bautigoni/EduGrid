import { getDb, newId, nowIso } from "@/lib/db";
import { seedDefaultTimeBlocksForCampus } from "./timeBlocks";

export type Campus = {
  id: string;
  name: string;
  display_name: string | null;
  code: string;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export function getAllCampuses(): Campus[] {
  return getDb().prepare("SELECT * FROM campuses WHERE is_active = 1 ORDER BY name").all() as Campus[];
}

export function getCampusById(id: string): Campus | null {
  return (getDb().prepare("SELECT * FROM campuses WHERE id = ?").get(id) as Campus | undefined) ?? null;
}

export function getCampusesForUser(user: { id: string; role: string } | null): Campus[] {
  if (!user) return [];
  if (user.role === "SUPERADMIN") return getAllCampuses();
  return getDb()
    .prepare(`SELECT c.* FROM campuses c
              JOIN user_campuses uc ON uc.campus_id = c.id
              WHERE uc.user_id = ? AND c.is_active = 1
              ORDER BY c.name`)
    .all(user.id) as Campus[];
}

export function createCampus(data: { name: string; code: string; address?: string; city?: string; province?: string; country?: string; display_name?: string }) {
  const db = getDb();
  const now = nowIso();
  const id = newId("cmp");
  db.prepare(`INSERT INTO campuses (id, name, display_name, code, address, city, province, country, is_active, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,1,?,?)`)
    .run(id, data.name, data.display_name ?? data.name, data.code, data.address ?? null, data.city ?? null, data.province ?? null, data.country ?? "Argentina", now, now);
  seedDefaultTimeBlocksForCampus(id);
  return getCampusById(id)!;
}

export function updateCampus(id: string, data: Partial<Pick<Campus, "name" | "display_name" | "code" | "address" | "city" | "province" | "country" | "is_active">>) {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (!fields.length) return getCampusById(id);
  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(id);
  db.prepare(`UPDATE campuses SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getCampusById(id);
}

export function archiveCampus(id: string) {
  getDb().prepare("UPDATE campuses SET is_active = 0, updated_at = ? WHERE id = ?").run(nowIso(), id);
}
