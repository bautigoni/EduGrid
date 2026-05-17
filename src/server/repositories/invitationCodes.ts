import { getDb, newId, nowIso } from "@/lib/db";

export type InvitationCode = {
  id: string;
  code: string;
  campus_id: string | null;
  role: string;
  label: string | null;
  is_active: number;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  requires_approval: number;
  created_at: string;
  updated_at: string;
};

export function getAllInvitationCodes(): InvitationCode[] {
  return getDb().prepare("SELECT * FROM invitation_codes ORDER BY created_at DESC").all() as InvitationCode[];
}

export function getInvitationByCode(code: string): InvitationCode | null {
  return (getDb().prepare("SELECT * FROM invitation_codes WHERE code = ?").get(code) as InvitationCode | undefined) ?? null;
}

export function createInvitationCode(data: {
  code: string;
  campus_id: string | null;
  role: string;
  label?: string;
  expires_at?: string | null;
  max_uses?: number | null;
  requires_approval?: boolean;
}): InvitationCode {
  const db = getDb();
  const now = nowIso();
  const id = newId("inv");
  db.prepare(`INSERT INTO invitation_codes
    (id, code, campus_id, role, label, is_active, expires_at, max_uses, used_count, requires_approval, created_at, updated_at)
    VALUES (?,?,?,?,?,1,?,?,0,?,?,?)`)
    .run(id, data.code, data.campus_id, data.role, data.label ?? null, data.expires_at ?? null, data.max_uses ?? null,
      data.requires_approval ? 1 : 0, now, now);
  return (db.prepare("SELECT * FROM invitation_codes WHERE id = ?").get(id) as InvitationCode);
}

export function setInvitationActive(id: string, active: boolean) {
  getDb().prepare("UPDATE invitation_codes SET is_active = ?, updated_at = ? WHERE id = ?").run(active ? 1 : 0, nowIso(), id);
}

export function deleteInvitation(id: string) {
  getDb().prepare("DELETE FROM invitation_codes WHERE id = ?").run(id);
}

export function incrementInvitationUsage(id: string) {
  getDb().prepare("UPDATE invitation_codes SET used_count = used_count + 1, updated_at = ? WHERE id = ?").run(nowIso(), id);
}
