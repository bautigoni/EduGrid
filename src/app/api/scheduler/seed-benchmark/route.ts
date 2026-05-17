import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";

/**
 * Loads the PART 11 benchmark dataset (6 courses · 20 teachers · 12 subjects)
 * into the selected campus. Idempotent: it wipes the previous courses /
 * teachers / subjects / requirements / availability / matrix for that campus
 * before seeding. The scheduler should be able to generate from this with
 * zero manual edits.
 */
const SUBJECTS = [
  ["Matemática", "MAT", "#fdba74", 5],
  ["Lengua", "LEN", "#f4a261", 5],
  ["Inglés", "ING", "#fb7185", 4],
  ["Ciencia", "CIE", "#86efac", 4],
  ["Historia", "HIS", "#f59e0b", 3],
  ["Geografía", "GEO", "#22d3ee", 3],
  ["Tecnología", "TEC", "#a78bfa", 2],
  ["Arte", "ART", "#c084fc", 2],
  ["Ed. Física", "EDF", "#34d399", 2],
  ["Ciudadanía", "CIU", "#f97316", 2],
  ["Proyecto", "PRO", "#60a5fa", 2],
  ["Tutoría", "TUT", "#94a3b8", 1]
] as const;

const COURSES = ["1A", "2A", "3A", "4A", "5A", "6A"] as const;

// For each subject, which teachers are eligible (and on which courses). Names
// loosely mirror the test scenario from the spec. Each subject has 2 teachers
// covering 3 courses each so every (course, subject) pair has 1–2 candidates.
const TEACHERS: Array<{ name: string; hours: number; teaches: Array<{ subject: typeof SUBJECTS[number][0]; courses: readonly string[] }> }> = [
  { name: "Ana Pérez", hours: 30, teaches: [{ subject: "Matemática", courses: ["1A", "2A", "3A"] }] },
  { name: "Bruno Lara", hours: 30, teaches: [{ subject: "Matemática", courses: ["4A", "5A", "6A"] }] },
  { name: "Camila Ruiz", hours: 30, teaches: [{ subject: "Lengua", courses: ["1A", "2A", "3A"] }] },
  { name: "Diego Solé", hours: 30, teaches: [{ subject: "Lengua", courses: ["4A", "5A", "6A"] }] },
  { name: "Elena Vidal", hours: 24, teaches: [{ subject: "Inglés", courses: ["1A", "2A", "3A"] }] },
  { name: "Sofía White", hours: 24, teaches: [{ subject: "Inglés", courses: ["4A", "5A", "6A"] }] },
  { name: "Gabriela Lima", hours: 24, teaches: [{ subject: "Ciencia", courses: ["1A", "2A", "3A"] }] },
  { name: "Hernán Lago", hours: 24, teaches: [{ subject: "Ciencia", courses: ["4A", "5A", "6A"] }] },
  { name: "Iván Castro", hours: 18, teaches: [{ subject: "Historia", courses: ["1A", "2A", "3A"] }] },
  { name: "Julia Brown", hours: 18, teaches: [{ subject: "Historia", courses: ["4A", "5A", "6A"] }] },
  { name: "Karen Vera", hours: 18, teaches: [{ subject: "Geografía", courses: ["1A", "2A", "3A"] }] },
  { name: "Lucas Pino", hours: 18, teaches: [{ subject: "Geografía", courses: ["4A", "5A", "6A"] }] },
  { name: "Vanina Gerstner", hours: 24, teaches: [{ subject: "Tecnología", courses: ["1A", "2A", "3A", "4A", "5A", "6A"] }] },
  { name: "Nora Sosa", hours: 18, teaches: [{ subject: "Arte", courses: ["1A", "2A", "3A", "4A", "5A", "6A"] }] },
  { name: "Fabián Ríos", hours: 18, teaches: [{ subject: "Ed. Física", courses: ["1A", "2A", "3A", "4A", "5A", "6A"] }] },
  { name: "Pablo Méndez", hours: 18, teaches: [{ subject: "Ciudadanía", courses: ["1A", "2A", "3A", "4A", "5A", "6A"] }] },
  { name: "Rocío Medina", hours: 18, teaches: [{ subject: "Proyecto", courses: ["1A", "2A", "3A"] }, { subject: "Tutoría", courses: ["1A", "2A", "3A"] }] },
  { name: "Tomás Herrera", hours: 18, teaches: [{ subject: "Proyecto", courses: ["4A", "5A", "6A"] }, { subject: "Tutoría", courses: ["4A", "5A", "6A"] }] },
  { name: "Marta Núñez", hours: 24, teaches: [{ subject: "Matemática", courses: ["1A", "2A"] }, { subject: "Ciencia", courses: ["4A", "5A"] }] },
  { name: "Pedro Gómez", hours: 24, teaches: [{ subject: "Lengua", courses: ["1A", "2A"] }, { subject: "Inglés", courses: ["5A", "6A"] }] }
];

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "COORDINADOR_HORARIOS", "SCHEDULER", "CAMPUS_ADMIN"]);
    const body = await request.json().catch(() => ({}));
    const campusId = body.campusId ?? getDefaultCampusId(user);
    if (!campusId) return NextResponse.json({ message: "No hay sede seleccionada." }, { status: 400 });
    requireCampusAccess(user, campusId);
    const db = getDb();
    const now = nowIso();

    const tx = db.transaction(() => {
      // Wipe scheduling-related data for this campus only.
      db.prepare("DELETE FROM schedule_assignments WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM conflicts WHERE campus_id = ?").run(campusId);
      db.prepare(`DELETE FROM forced_assignments WHERE campus_id = ?`).run(campusId);
      db.prepare(`DELETE FROM project_teachers WHERE project_id IN (SELECT id FROM projects WHERE campus_id = ?)`).run(campusId);
      db.prepare(`DELETE FROM project_courses WHERE project_id IN (SELECT id FROM projects WHERE campus_id = ?)`).run(campusId);
      db.prepare("DELETE FROM projects WHERE campus_id = ?").run(campusId);
      db.prepare(`DELETE FROM teacher_availability WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)`).run(campusId);
      db.prepare(`DELETE FROM course_availability WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)`).run(campusId);
      db.prepare(`DELETE FROM teacher_subject_course_eligibility WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)`).run(campusId);
      db.prepare(`DELETE FROM teacher_subjects WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)`).run(campusId);
      db.prepare(`DELETE FROM teacher_course_eligibility WHERE teacher_id IN (SELECT id FROM teachers WHERE campus_id = ?)`).run(campusId);
      db.prepare(`DELETE FROM course_subject_requirements WHERE course_id IN (SELECT id FROM courses WHERE campus_id = ?)`).run(campusId);
      db.prepare("DELETE FROM teachers WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM courses WHERE campus_id = ?").run(campusId);
      db.prepare("DELETE FROM subjects WHERE campus_id = ?").run(campusId);

      // Subjects
      const subjectIdByName = new Map<string, string>();
      const insertSubject = db.prepare(
        "INSERT INTO subjects (id, campus_id, name, code, color, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,?,?)"
      );
      for (const [name, code, color] of SUBJECTS) {
        const id = newId("sub");
        insertSubject.run(id, campusId, name, code, color, now, now);
        subjectIdByName.set(name, id);
      }

      // Courses
      const courseIdByName = new Map<string, string>();
      const insertCourse = db.prepare(
        "INSERT INTO courses (id, campus_id, name, year, division, default_classroom_label, student_count, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,1,?,?)"
      );
      for (const name of COURSES) {
        const id = newId("crs");
        const year = Number(name[0]);
        const division = name[1];
        insertCourse.run(id, campusId, name, year, division, `Aula ${name}`, 28, now, now);
        courseIdByName.set(name, id);
      }

      // Course subject requirements
      const insertReq = db.prepare(
        "INSERT INTO course_subject_requirements (id, campus_id, course_id, subject_id, weekly_blocks_required, created_at, updated_at) VALUES (?,?,?,?,?,?,?)"
      );
      for (const courseName of COURSES) {
        const courseId = courseIdByName.get(courseName)!;
        for (const [sName, , , hours] of SUBJECTS) {
          insertReq.run(newId("csr"), campusId, courseId, subjectIdByName.get(sName)!, hours, now, now);
        }
      }

      // Course availability: every assignable block AVAILABLE.
      const courseAvailableBlocks = db.prepare(
        "SELECT id FROM time_blocks WHERE campus_id = ? AND is_assignable = 1"
      ).all(campusId) as Array<{ id: string }>;
      const insertCourseAv = db.prepare(
        "INSERT INTO course_availability (id, course_id, time_block_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?)"
      );
      for (const courseId of courseIdByName.values()) {
        for (const b of courseAvailableBlocks) {
          insertCourseAv.run(newId("ca"), courseId, b.id, "AVAILABLE", now, now);
        }
      }

      // Teachers
      const teacherIdByName = new Map<string, string>();
      const insertTeacher = db.prepare(
        "INSERT INTO teachers (id, campus_id, full_name, email, contractual_weekly_minutes, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,?,?)"
      );
      for (const t of TEACHERS) {
        const id = newId("tch");
        insertTeacher.run(id, campusId, t.name, null, t.hours * 60, now, now);
        teacherIdByName.set(t.name, id);
      }

      // Eligibility matrix (combined) + legacy teacher_subjects (so older UI helpers still work)
      const insertMatrix = db.prepare(
        "INSERT OR IGNORE INTO teacher_subject_course_eligibility (id, teacher_id, subject_id, course_id, created_at, updated_at) VALUES (?,?,?,?,?,?)"
      );
      const insertLegacySubject = db.prepare(
        "INSERT OR IGNORE INTO teacher_subjects (id, teacher_id, subject_id, created_at) VALUES (?,?,?,?)"
      );
      for (const t of TEACHERS) {
        const teacherId = teacherIdByName.get(t.name)!;
        for (const entry of t.teaches) {
          const subjectId = subjectIdByName.get(entry.subject);
          if (!subjectId) continue;
          insertLegacySubject.run(newId("ts"), teacherId, subjectId, now);
          for (const c of entry.courses) {
            const cid = courseIdByName.get(c);
            if (!cid) continue;
            insertMatrix.run(newId("tsce"), teacherId, subjectId, cid, now, now);
          }
        }
      }

      // Teacher availability: AVAILABLE in every assignable block (the scheduler
      // is responsible for honouring contractual minutes).
      const teacherAvailableBlocks = courseAvailableBlocks;
      const insertTeacherAv = db.prepare(
        "INSERT INTO teacher_availability (id, teacher_id, time_block_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?)"
      );
      for (const teacherId of teacherIdByName.values()) {
        for (const b of teacherAvailableBlocks) {
          insertTeacherAv.run(newId("ta"), teacherId, b.id, "AVAILABLE", now, now);
        }
      }
    });
    tx();

    return NextResponse.json({
      ok: true,
      counts: { subjects: SUBJECTS.length, courses: COURSES.length, teachers: TEACHERS.length, requirements: SUBJECTS.length * COURSES.length }
    });
  } catch (error) {
    return jsonError(error);
  }
}
