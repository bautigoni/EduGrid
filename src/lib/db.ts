import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DB_FILE = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "horaria.db");
const DB_DIR = path.dirname(DB_FILE);

type DatabaseInstance = ReturnType<typeof Database>;
let _db: DatabaseInstance | null = null;

export function getDb(): DatabaseInstance {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  _db = db;
  return db;
}

export function dbFilePath() {
  return DB_FILE;
}

export function newId(prefix?: string) {
  const rnd = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return prefix ? `${prefix}_${rnd}` : rnd;
}

export function nowIso() {
  return new Date().toISOString();
}

export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
