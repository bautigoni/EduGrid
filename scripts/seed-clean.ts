/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import { getDb, newId, nowIso } from "../src/lib/db";
import { seedDefaultTimeBlocksForCampus } from "../src/server/repositories/timeBlocks";

/**
 * Clean seed: superadmin user + invitation codes, no demo data.
 * Run with: npm run db:seed:clean
 */
function main() {
  const db = getDb();
  const now = nowIso();

  // Default campus only for superadmin to start scoping codes against
  let campus = db.prepare("SELECT id FROM campuses LIMIT 1").get() as { id: string } | undefined;
  if (!campus) {
    const id = newId("cmp");
    db.prepare(`INSERT INTO campuses (id, name, display_name, code, country, is_active, created_at, updated_at)
                VALUES (?,?,?,?,?,1,?,?)`).run(id, "Sede Principal", "Sede Principal", "MAIN-1", "Argentina", now, now);
    campus = { id };
    seedDefaultTimeBlocksForCampus(id);
  }

  // Superadmin
  const adminEmail = "admin@horaria.local";
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);
  if (!existing) {
    const id = newId("usr");
    const passwordHash = bcrypt.hashSync("horaria-admin", 10);
    db.prepare(`INSERT INTO users (id, full_name, email, password_hash, role, status, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?)`).run(id, "Superadmin", adminEmail, passwordHash, "SUPERADMIN", "ACTIVE", now, now);
  }

  // Default invitation codes
  const codes = [
    { code: "HORARIA-SUPERADMIN-2026", campus_id: null, role: "SUPERADMIN", label: "Superadmin demo" },
    { code: "MAIN-COORDINADOR-2026", campus_id: campus.id, role: "COORDINADOR_HORARIOS", label: "Coordinador Sede Principal" }
  ];
  const insertCode = db.prepare(`INSERT OR IGNORE INTO invitation_codes
    (id, code, campus_id, role, label, is_active, used_count, requires_approval, created_at, updated_at)
    VALUES (?,?,?,?,?,1,0,0,?,?)`);
  for (const c of codes) {
    insertCode.run(newId("inv"), c.code, c.campus_id, c.role, c.label, now, now);
  }

  console.log("[db:seed:clean] done");
  console.log("  Superadmin user: admin@horaria.local / horaria-admin");
  console.log("  Invitation codes:");
  for (const c of codes) console.log(`    ${c.code}`);
}

main();
