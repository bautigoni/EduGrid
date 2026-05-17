/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { dbFilePath } from "../src/lib/db";

function main() {
  const src = dbFilePath();
  if (!fs.existsSync(src)) {
    console.error("[db:backup] no database file at", src);
    process.exit(1);
  }
  const backupsDir = path.join(process.cwd(), "data", "backups");
  fs.mkdirSync(backupsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(backupsDir, `horaria-${stamp}.db`);
  fs.copyFileSync(src, dest);
  console.log(`[db:backup] copied to ${dest}`);
}

main();
