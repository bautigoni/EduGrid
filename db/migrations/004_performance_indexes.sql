-- 004_performance_indexes.sql
-- Hot-path indexes for SQLite. All wrapped in IF NOT EXISTS so the migration
-- is safe to re-run.

CREATE INDEX IF NOT EXISTS idx_teachers_campus               ON teachers(campus_id);
CREATE INDEX IF NOT EXISTS idx_courses_campus                ON courses(campus_id);
CREATE INDEX IF NOT EXISTS idx_subjects_campus               ON subjects(campus_id);

CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher  ON teacher_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_block    ON teacher_availability(time_block_id);

CREATE INDEX IF NOT EXISTS idx_course_availability_course    ON course_availability(course_id);
CREATE INDEX IF NOT EXISTS idx_course_availability_block     ON course_availability(time_block_id);

CREATE INDEX IF NOT EXISTS idx_course_subject_req_course     ON course_subject_requirements(course_id);
CREATE INDEX IF NOT EXISTS idx_course_subject_req_subject    ON course_subject_requirements(subject_id);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher      ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject      ON teacher_subjects(subject_id);

CREATE INDEX IF NOT EXISTS idx_teacher_course_elig_teacher   ON teacher_course_eligibility(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_course_elig_course    ON teacher_course_eligibility(course_id);

CREATE INDEX IF NOT EXISTS idx_tsce_teacher                  ON teacher_subject_course_eligibility(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tsce_subject_course           ON teacher_subject_course_eligibility(subject_id, course_id);

CREATE INDEX IF NOT EXISTS idx_schedule_assignments_version  ON schedule_assignments(schedule_version_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_campus   ON schedule_assignments(campus_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_teacher  ON schedule_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_course   ON schedule_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_subject  ON schedule_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_block    ON schedule_assignments(time_block_id);

CREATE INDEX IF NOT EXISTS idx_conflicts_campus              ON conflicts(campus_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_version             ON conflicts(schedule_version_id);

CREATE INDEX IF NOT EXISTS idx_invitation_codes_code         ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_users_email                   ON users(email);

CREATE INDEX IF NOT EXISTS idx_forced_assignments_campus     ON forced_assignments(campus_id);
CREATE INDEX IF NOT EXISTS idx_forced_assignments_block      ON forced_assignments(time_block_id);

CREATE INDEX IF NOT EXISTS idx_project_teachers_project      ON project_teachers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_courses_project       ON project_courses(project_id);

CREATE INDEX IF NOT EXISTS idx_time_blocks_campus_day        ON time_blocks(campus_id, day_of_week);
