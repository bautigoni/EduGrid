-- Generation safety additions.
-- Existing databases need block_value for pedagogical accounting and stronger
-- indexes for scheduler reads/writes. schedule_versions.status is text already;
-- accepted values are DRAFT, GENERATING, COMPLETED, FAILED.

ALTER TABLE time_blocks ADD COLUMN block_value INTEGER NOT NULL DEFAULT 1;

UPDATE time_blocks
SET block_value = CASE WHEN is_assignable = 1 AND type = 'CLASS' THEN 1 ELSE 0 END;

CREATE INDEX IF NOT EXISTS idx_schedule_versions_campus_status
  ON schedule_versions(campus_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_schedule_assignments_campus_teacher_block
  ON schedule_assignments(campus_id, teacher_id, time_block_id);

CREATE INDEX IF NOT EXISTS idx_schedule_assignments_campus_course_block
  ON schedule_assignments(campus_id, course_id, time_block_id);

CREATE INDEX IF NOT EXISTS idx_conflicts_campus_version
  ON conflicts(campus_id, schedule_version_id);

CREATE INDEX IF NOT EXISTS idx_time_blocks_campus_assignable
  ON time_blocks(campus_id, is_assignable, type);

UPDATE schedule_versions
SET status = 'COMPLETED'
WHERE status = 'SUCCESS';
