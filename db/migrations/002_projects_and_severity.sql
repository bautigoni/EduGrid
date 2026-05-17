-- 002_projects_and_severity.sql
-- Adds project weekly load, flexible/fixed mode and notes; refreshes the
-- conflicts severity vocabulary. better-sqlite3 supports ALTER TABLE ADD COLUMN.
ALTER TABLE projects ADD COLUMN weekly_blocks_required INTEGER NOT NULL DEFAULT 1;
ALTER TABLE projects ADD COLUMN flexible INTEGER NOT NULL DEFAULT 1;
ALTER TABLE projects ADD COLUMN notes TEXT;
