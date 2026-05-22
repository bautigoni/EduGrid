/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import { getDb, newId, nowIso } from "../src/lib/db";
import { seedDefaultTimeBlocksForCampus } from "../src/server/repositories/timeBlocks";

/**
 * Demo seed: two campuses + subjects + a couple of teachers/courses.
 * Run with: npm run db:seed:demo
 */
function main() {
  const db = getDb();
  const now = nowIso();

  const campusDef = [
    { id: newId("cmp"), name: "Northfield Nordelta", code: "NFD-NOR", city: "Tigre" },
    { id: newId("cmp"), name: "Northfield Puertos", code: "NFD-PUE", city: "Escobar" }
  ];

  const insertCampus = db.prepare(`INSERT OR IGNORE INTO campuses
    (id, name, display_name, code, city, country, is_active, created_at, updated_at)
    VALUES (?,?,?,?,?,?,1,?,?)`);
  for (const c of campusDef) {
    insertCampus.run(c.id, c.name, c.name, c.code, c.city, "Argentina", now, now);
    seedDefaultTimeBlocksForCampus(c.id);
  }

  // Demo superadmin (admin@horaria.demo)
  const demoEmail = "admin@horaria.demo";
  if (!db.prepare("SELECT id FROM users WHERE email = ?").get(demoEmail)) {
    db.prepare(`INSERT INTO users (id, full_name, email, password_hash, role, status, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?)`)
      .run(newId("usr"), "Superadmin Demo", demoEmail, bcrypt.hashSync("horaria-demo", 10), "SUPERADMIN", "ACTIVE", now, now);
  }

  // Canonical admin (admin@horaria.local / horaria-admin) — upsert so it always works
  const localEmail = "admin@horaria.local";
  const localHash = bcrypt.hashSync("horaria-admin", 10);
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(localEmail) as { id: string } | undefined;
  if (existing) {
    db.prepare(`UPDATE users SET password_hash=?, role='SUPERADMIN', status='ACTIVE', updated_at=? WHERE id=?`)
      .run(localHash, now, existing.id);
  } else {
    db.prepare(`INSERT INTO users (id, full_name, email, password_hash, role, status, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?)`)
      .run(newId("usr"), "Superadmin", localEmail, localHash, "SUPERADMIN", "ACTIVE", now, now);
  }

  // Subjects per campus
  const subjectsTemplate = [
    { name: "Matemática", code: "MAT", color: "#FDBA74" },
    { name: "Lengua", code: "LEN", color: "#F4A261" },
    { name: "Física", code: "FIS", color: "#60A5FA" },
    { name: "Historia", code: "HIS", color: "#F59E0B" },
    { name: "Biología", code: "BIO", color: "#A7C957" },
    { name: "Tecnología", code: "TEC", color: "#86EFAC" },
    { name: "Inglés", code: "ING", color: "#FB7185" },
    { name: "Arte", code: "ART", color: "#C084FC" }
  ];
  const insertSubject = db.prepare(`INSERT OR IGNORE INTO subjects
    (id, campus_id, name, code, color, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,?,?)`);
  for (const campus of campusDef) {
    for (const sub of subjectsTemplate) {
      insertSubject.run(newId("sub"), campus.id, sub.name, sub.code, sub.color, now, now);
    }
  }

  // Invitation codes
  const codes = [
    { code: "HORARIA-SUPERADMIN-2026", campus_id: null, role: "SUPERADMIN", label: "Superadmin demo" },
    { code: "NORDELTA-HORARIOS-2026", campus_id: campusDef[0].id, role: "COORDINADOR_HORARIOS", label: "Coordinación Nordelta" },
    { code: "PUERTOS-HORARIOS-2026", campus_id: campusDef[1].id, role: "COORDINADOR_HORARIOS", label: "Coordinación Puertos" }
  ];
  const insertCode = db.prepare(`INSERT OR IGNORE INTO invitation_codes
    (id, code, campus_id, role, label, is_active, used_count, requires_approval, created_at, updated_at)
    VALUES (?,?,?,?,?,1,0,0,?,?)`);
  for (const c of codes) insertCode.run(newId("inv"), c.code, c.campus_id, c.role, c.label, now, now);

  console.log("[db:seed:demo] done");
  console.log("  Login: admin@horaria.local / horaria-admin");
}

main();
