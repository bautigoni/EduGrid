-- 001_initial_schema.sql
-- Idempotent: re-applies the same schema; uses IF NOT EXISTS everywhere.
-- See db/schema.sql for the canonical definition. This migration file is
-- intentionally identical so the runner can replay it on a fresh database.
PRAGMA foreign_keys = ON;
