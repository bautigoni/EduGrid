-- 003_eligibility_matrix_and_forced.sql
-- Combined teacher×subject×course eligibility + forced/manual assignments.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teacher_subject_course_eligibility (
  id         TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(teacher_id, subject_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_tsce_teacher ON teacher_subject_course_eligibility(teacher_id);

CREATE TABLE IF NOT EXISTS forced_assignments (
  id              TEXT PRIMARY KEY,
  campus_id       TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  course_id       TEXT REFERENCES courses(id) ON DELETE CASCADE,
  subject_id      TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id      TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  time_block_id   TEXT NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL,
  reason          TEXT,
  hard_override   INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_forced_campus ON forced_assignments(campus_id);

-- Flag on schedule_assignments so the planner can render a "Forzado" badge.
ALTER TABLE schedule_assignments ADD COLUMN forced INTEGER NOT NULL DEFAULT 0;
