/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { getDb, dbFilePath } from "../src/lib/db";

const schemaPath = path.join(process.cwd(), "db", "schema.sql");

function main() {
  if (!fs.existsSync(schemaPath)) {
    console.error("[db:init] schema.sql not found at", schemaPath);
    process.exit(1);
  }
  const db = getDb();
  const sql = fs.readFileSync(schemaPath, "utf8");
  db.exec(sql);
  // Track schema version
  db.exec(`CREATE TABLE IF NOT EXISTS _schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  );`);
  const has = db.prepare("SELECT id FROM _schema_migrations WHERE id = ?").get("001_initial_schema");
  if (!has) {
    db.prepare("INSERT INTO _schema_migrations (id, applied_at) VALUES (?, ?)").run("001_initial_schema", new Date().toISOString());
  }
  console.log(`[db:init] SQLite database ready at ${dbFilePath()}`);
}

main();
