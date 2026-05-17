/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/lib/db";

const migrationsDir = path.join(process.cwd(), "db", "migrations");
const schemaPath = path.join(process.cwd(), "db", "schema.sql");

function main() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS _schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  );`);

  // 1) Always (re)apply canonical schema (idempotent: uses IF NOT EXISTS)
  if (fs.existsSync(schemaPath)) {
    db.exec(fs.readFileSync(schemaPath, "utf8"));
  }

  // 2) Apply any numbered migrations
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    const applied = new Set(
      db.prepare("SELECT id FROM _schema_migrations").all().map((row: any) => row.id)
    );
    for (const file of files) {
      const id = file.replace(/\.sql$/, "");
      if (applied.has(id)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      try {
        db.exec(sql);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.toLowerCase().includes("duplicate column name")) {
          throw error;
        }
        console.warn(`[db:migrate] ${id} skipped duplicate-column step; schema already has it`);
      }
      db.prepare("INSERT INTO _schema_migrations (id, applied_at) VALUES (?, ?)").run(id, new Date().toISOString());
      console.log(`[db:migrate] applied ${id}`);
    }
  }
  console.log("[db:migrate] done");
}

main();
