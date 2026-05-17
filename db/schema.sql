-- Horaria SQLite schema.
-- All ids are TEXT (UUID/cuid-style). Timestamps are ISO-8601 TEXT.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS campuses (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  display_name TEXT,
  code         TEXT NOT NULL UNIQUE,
  address      TEXT,
  city         TEXT,
  province     TEXT,
  country      TEXT DEFAULT 'Argentina',
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_campuses (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campus_id  TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, campus_id)
);

CREATE TABLE IF NOT EXISTS invitation_codes (
  id                TEXT PRIMARY KEY,
  code              TEXT NOT NULL UNIQUE,
  campus_id         TEXT REFERENCES campuses(id) ON DELETE SET NULL,
  role              TEXT NOT NULL,
  label             TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1,
  expires_at        TEXT,
  max_uses          INTEGER,
  used_count        INTEGER NOT NULL DEFAULT 0,
  requires_approval INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id         TEXT PRIMARY KEY,
  campus_id  TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  code       TEXT,
  color      TEXT,
  notes      TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id                       TEXT PRIMARY KEY,
  campus_id                TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  year                     INTEGER,
  division                 TEXT,
  default_classroom_label  TEXT,
  student_count            INTEGER,
  is_active                INTEGER NOT NULL DEFAULT 1,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teachers (
  id                         TEXT PRIMARY KEY,
  campus_id                  TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  full_name                  TEXT NOT NULL,
  email                      TEXT,
  contractual_weekly_minutes INTEGER NOT NULL DEFAULT 0,
  allow_institutional_hours  INTEGER NOT NULL DEFAULT 1,
  notes                      TEXT,
  is_active                  INTEGER NOT NULL DEFAULT 1,
  created_at                 TEXT NOT NULL,
  updated_at                 TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_subjects (
  id         TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(teacher_id, subject_id)
);

CREATE TABLE IF NOT EXISTS teacher_course_eligibility (
  id         TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(teacher_id, course_id)
);

CREATE TABLE IF NOT EXISTS teacher_subject_course_eligibility (
  id         TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(teacher_id, subject_id, course_id)
);

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

CREATE TABLE IF NOT EXISTS time_blocks (
  id              TEXT PRIMARY KEY,
  campus_id       TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL,
  block_index     INTEGER NOT NULL,
  start_time      TEXT NOT NULL,
  end_time        TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  block_value      INTEGER NOT NULL DEFAULT 1,
  label           TEXT NOT NULL,
  type            TEXT NOT NULL,
  is_assignable   INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  UNIQUE(campus_id, day_of_week, block_index, type)
);

CREATE TABLE IF NOT EXISTS teacher_availability (
  id            TEXT PRIMARY KEY,
  teacher_id    TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  time_block_id TEXT NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE(teacher_id, time_block_id)
);

CREATE TABLE IF NOT EXISTS course_availability (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  time_block_id TEXT NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE(course_id, time_block_id)
);

CREATE TABLE IF NOT EXISTS course_subject_requirements (
  id                       TEXT PRIMARY KEY,
  campus_id                TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  course_id                TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  subject_id               TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  weekly_blocks_required   INTEGER NOT NULL DEFAULT 0,
  weekly_minutes_required  INTEGER,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL,
  UNIQUE(course_id, subject_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id                     TEXT PRIMARY KEY,
  campus_id              TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  type                   TEXT NOT NULL,
  description            TEXT,
  fixed_time_block_id    TEXT REFERENCES time_blocks(id) ON DELETE SET NULL,
  weekly_blocks_required INTEGER NOT NULL DEFAULT 1,
  flexible               INTEGER NOT NULL DEFAULT 1,
  notes                  TEXT,
  is_active              INTEGER NOT NULL DEFAULT 1,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_teachers (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  UNIQUE(project_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS project_courses (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(project_id, course_id)
);

CREATE TABLE IF NOT EXISTS schedule_versions (
  id           TEXT PRIMARY KEY,
  campus_id    TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL,
  generated_at TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_assignments (
  id                  TEXT PRIMARY KEY,
  schedule_version_id TEXT NOT NULL REFERENCES schedule_versions(id) ON DELETE CASCADE,
  campus_id           TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  course_id           TEXT REFERENCES courses(id) ON DELETE SET NULL,
  subject_id          TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id          TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  time_block_id       TEXT NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  assignment_type     TEXT NOT NULL,
  title               TEXT,
  forced              INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conflicts (
  id                  TEXT PRIMARY KEY,
  campus_id           TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  schedule_version_id TEXT REFERENCES schedule_versions(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  severity            TEXT NOT NULL,
  message             TEXT NOT NULL,
  suggestion          TEXT,
  entity_type         TEXT,
  entity_id           TEXT,
  created_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exports_log (
  id           TEXT PRIMARY KEY,
  campus_id    TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  export_type  TEXT NOT NULL,
  filter_type  TEXT,
  filter_value TEXT,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          TEXT PRIMARY KEY,
  campus_id   TEXT REFERENCES campuses(id) ON DELETE SET NULL,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  metadata    TEXT,
  created_at  TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_campus ON subjects(campus_id);
CREATE INDEX IF NOT EXISTS idx_courses_campus ON courses(campus_id);
CREATE INDEX IF NOT EXISTS idx_teachers_campus ON teachers(campus_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_campus_day ON time_blocks(campus_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_csr_course ON course_subject_requirements(course_id);
CREATE INDEX IF NOT EXISTS idx_ta_teacher ON teacher_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ca_course ON course_availability(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_version ON schedule_assignments(schedule_version_id);
CREATE INDEX IF NOT EXISTS idx_schedule_versions_campus_status ON schedule_versions(campus_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_campus_teacher_block ON schedule_assignments(campus_id, teacher_id, time_block_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_campus_course_block ON schedule_assignments(campus_id, course_id, time_block_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_campus_version ON conflicts(campus_id, schedule_version_id);

-- Views for analytics
DROP VIEW IF EXISTS view_teacher_load;
CREATE VIEW view_teacher_load AS
SELECT
  t.id AS teacher_id,
  t.campus_id,
  t.full_name,
  t.contractual_weekly_minutes,
  COALESCE(SUM(tb.duration_minutes), 0) AS available_weekly_minutes
FROM teachers t
LEFT JOIN teacher_availability ta ON ta.teacher_id = t.id AND ta.status = 'AVAILABLE'
LEFT JOIN time_blocks tb ON tb.id = ta.time_block_id
WHERE t.is_active = 1
GROUP BY t.id;

DROP VIEW IF EXISTS view_course_weekly_requirements;
CREATE VIEW view_course_weekly_requirements AS
SELECT
  c.id AS course_id,
  c.campus_id,
  c.name AS course_name,
  s.id AS subject_id,
  s.name AS subject_name,
  csr.weekly_blocks_required,
  csr.weekly_minutes_required
FROM courses c
JOIN course_subject_requirements csr ON csr.course_id = c.id
JOIN subjects s ON s.id = csr.subject_id;

DROP VIEW IF EXISTS view_schedule_assignments_full;
CREATE VIEW view_schedule_assignments_full AS
SELECT
  sa.id,
  sa.schedule_version_id,
  sv.name AS version_name,
  sa.campus_id,
  cmp.name AS campus_name,
  sa.course_id,
  c.name AS course_name,
  sa.subject_id,
  s.name AS subject_name,
  s.color AS subject_color,
  sa.teacher_id,
  t.full_name AS teacher_name,
  sa.time_block_id,
  tb.day_of_week,
  tb.block_index,
  tb.start_time,
  tb.end_time,
  tb.label AS block_label,
  sa.assignment_type,
  sa.title
FROM schedule_assignments sa
JOIN schedule_versions sv ON sv.id = sa.schedule_version_id
JOIN campuses cmp ON cmp.id = sa.campus_id
LEFT JOIN courses c ON c.id = sa.course_id
LEFT JOIN subjects s ON s.id = sa.subject_id
LEFT JOIN teachers t ON t.id = sa.teacher_id
JOIN time_blocks tb ON tb.id = sa.time_block_id;

DROP VIEW IF EXISTS view_conflicts_summary;
CREATE VIEW view_conflicts_summary AS
SELECT
  campus_id,
  schedule_version_id,
  severity,
  type,
  COUNT(*) AS count
FROM conflicts
GROUP BY campus_id, schedule_version_id, severity, type;

DROP VIEW IF EXISTS view_subject_hours_by_course;
CREATE VIEW view_subject_hours_by_course AS
SELECT
  c.campus_id,
  c.id AS course_id,
  c.name AS course_name,
  s.id AS subject_id,
  s.name AS subject_name,
  csr.weekly_blocks_required AS hours_required
FROM courses c
JOIN course_subject_requirements csr ON csr.course_id = c.id
JOIN subjects s ON s.id = csr.subject_id;
