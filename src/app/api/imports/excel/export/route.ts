import * as XLSX from "xlsx";
import { getDb } from "@/lib/db";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess } from "@/lib/access-control";

export const runtime = "nodejs";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

/**
 * Exports the current state of one campus into the same multi-sheet shape the
 * importer reads. Round-trip: download → edit → reupload.
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const campusId = url.searchParams.get("campusId") ?? getDefaultCampusId(user);
    if (!campusId) return new Response("Sede no encontrada.", { status: 400 });
    requireCampusAccess(user, campusId);
    const db = getDb();

    const campus = db.prepare("SELECT name FROM campuses WHERE id = ?").get(campusId) as { name: string } | undefined;
    const campusName = campus?.name ?? "Sede";

    const wb = XLSX.utils.book_new();

    // README
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Instrucciones: `Datos actuales de la sede "${campusName}" (exportados desde Horaria).` },
      { Instrucciones: "Podés editar este archivo y reimportarlo desde Centro de importaciones → Importar Excel completo." }
    ]), "README");

    // Cursos
    const courses = db.prepare(
      "SELECT name, year, division, default_classroom_label, student_count FROM courses WHERE campus_id = ? AND is_active = 1 ORDER BY name"
    ).all(campusId) as Array<{ name: string; year: number | null; division: string | null; default_classroom_label: string | null; student_count: number | null }>;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      courses.map((c) => ({
        Curso: c.name,
        Año: c.year ?? "",
        División: c.division ?? "",
        "Aula base": c.default_classroom_label ?? "",
        "Cantidad de estudiantes": c.student_count ?? "",
        Sede: campusName
      }))
    ), "Cursos");

    // Materias
    const subjects = db.prepare(
      "SELECT name, code, color FROM subjects WHERE campus_id = ? AND is_active = 1 ORDER BY name"
    ).all(campusId) as Array<{ name: string; code: string | null; color: string | null }>;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      subjects.map((s) => ({ Materia: s.name, Código: s.code ?? "", Color: s.color ?? "", Sede: campusName }))
    ), "Materias");

    // Docentes
    const teachers = db.prepare(
      "SELECT id, full_name, email, contractual_weekly_minutes, notes FROM teachers WHERE campus_id = ? AND is_active = 1 ORDER BY full_name"
    ).all(campusId) as Array<{ id: string; full_name: string; email: string | null; contractual_weekly_minutes: number; notes: string | null }>;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      teachers.map((t) => ({
        Docente: t.full_name,
        Email: t.email ?? "",
        "Carga contractual semanal": Math.round((t.contractual_weekly_minutes ?? 0) / 60),
        Notas: t.notes ?? "",
        Sede: campusName
      }))
    ), "Docentes");

    // Carga por curso
    const requirements = db.prepare(
      `SELECT c.name AS course, s.name AS subject, csr.weekly_blocks_required AS hours
       FROM course_subject_requirements csr
       JOIN courses c ON c.id = csr.course_id
       JOIN subjects s ON s.id = csr.subject_id
       WHERE c.campus_id = ? ORDER BY c.name, s.name`
    ).all(campusId) as Array<{ course: string; subject: string; hours: number }>;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      requirements.map((r) => ({ Curso: r.course, Materia: r.subject, "Horas semanales": r.hours, Sede: campusName }))
    ), "Carga por curso");

    // Habilitaciones docentes
    const matrix = db.prepare(
      `SELECT t.full_name AS teacher, s.name AS subject, c.name AS course
       FROM teacher_subject_course_eligibility tsce
       JOIN teachers t ON t.id = tsce.teacher_id
       JOIN subjects s ON s.id = tsce.subject_id
       JOIN courses c ON c.id = tsce.course_id
       WHERE t.campus_id = ? ORDER BY t.full_name, s.name, c.name`
    ).all(campusId) as Array<{ teacher: string; subject: string; course: string }>;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      matrix.map((m) => ({ Docente: m.teacher, Materia: m.subject, Curso: m.course, Sede: campusName }))
    ), "Habilitaciones docentes");

    // Disponibilidad docentes
    const teacherAvail = db.prepare(
      `SELECT t.full_name AS teacher, tb.day_of_week AS day, tb.block_index AS idx, tb.start_time AS start_time, tb.end_time AS end_time, ta.status AS status
       FROM teacher_availability ta
       JOIN teachers t ON t.id = ta.teacher_id
       JOIN time_blocks tb ON tb.id = ta.time_block_id
       WHERE t.campus_id = ? ORDER BY t.full_name, tb.day_of_week, tb.start_time`
    ).all(campusId) as Array<{ teacher: string; day: number; idx: number | null; start_time: string; end_time: string; status: string }>;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      teacherAvail.map((r) => ({
        Docente: r.teacher,
        Día: DAY_NAMES[r.day] ?? r.day,
        Bloque: r.idx ?? "",
        Inicio: r.start_time,
        Fin: r.end_time,
        Estado: r.status === "AVAILABLE" ? "Disponible" : "No disponible",
        Sede: campusName
      }))
    ), "Disponibilidad docentes");

    // Disponibilidad cursos
    const courseAvail = db.prepare(
      `SELECT c.name AS course, tb.day_of_week AS day, tb.block_index AS idx, tb.start_time AS start_time, tb.end_time AS end_time, ca.status AS status
       FROM course_availability ca
       JOIN courses c ON c.id = ca.course_id
       JOIN time_blocks tb ON tb.id = ca.time_block_id
       WHERE c.campus_id = ? ORDER BY c.name, tb.day_of_week, tb.start_time`
    ).all(campusId) as Array<{ course: string; day: number; idx: number | null; start_time: string; end_time: string; status: string }>;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      courseAvail.map((r) => ({
        Curso: r.course,
        Día: DAY_NAMES[r.day] ?? r.day,
        Bloque: r.idx ?? "",
        Inicio: r.start_time,
        Fin: r.end_time,
        Estado: r.status === "AVAILABLE" ? "Disponible" : "No disponible",
        Sede: campusName
      }))
    ), "Disponibilidad cursos");

    // Proyectos
    const projects = db.prepare(
      "SELECT id, name, type, description, fixed_time_block_id, weekly_blocks_required, notes FROM projects WHERE campus_id = ? AND is_active = 1"
    ).all(campusId) as Array<{ id: string; name: string; type: string; description: string | null; fixed_time_block_id: string | null; weekly_blocks_required: number; notes: string | null }>;
    const projectRows = projects.map((p) => {
      const teacherNames = (db.prepare(
        "SELECT t.full_name AS n FROM project_teachers pt JOIN teachers t ON t.id = pt.teacher_id WHERE pt.project_id = ?"
      ).all(p.id) as Array<{ n: string }>).map((r) => r.n).join(",");
      const courseNames = (db.prepare(
        "SELECT c.name AS n FROM project_courses pc JOIN courses c ON c.id = pc.course_id WHERE pc.project_id = ?"
      ).all(p.id) as Array<{ n: string }>).map((r) => r.n).join(",");
      const fixed = p.fixed_time_block_id
        ? (db.prepare("SELECT day_of_week, block_index, start_time, end_time FROM time_blocks WHERE id = ?").get(p.fixed_time_block_id) as { day_of_week: number; block_index: number | null; start_time: string; end_time: string } | undefined)
        : undefined;
      return {
        Proyecto: p.name,
        Tipo: p.type,
        Cursos: courseNames,
        Docentes: teacherNames,
        "Horas semanales": p.weekly_blocks_required,
        "Día fijo": fixed ? DAY_NAMES[fixed.day_of_week] : "",
        "Bloque fijo": fixed?.block_index ?? "",
        "Inicio fijo": fixed?.start_time ?? "",
        "Fin fijo": fixed?.end_time ?? "",
        Notas: p.notes ?? p.description ?? "",
        Sede: campusName
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projectRows), "Proyectos");

    // Aulas especiales (empty for now — schema-wise)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([] as Array<Record<string, string>>), "Aulas especiales");

    // Forzados
    const forced = db.prepare(
      `SELECT c.name AS course, s.name AS subject, t.full_name AS teacher,
              tb.day_of_week AS day, tb.block_index AS idx, tb.start_time AS start_time, tb.end_time AS end_time,
              fa.assignment_type AS type, fa.reason AS reason
       FROM forced_assignments fa
       LEFT JOIN courses c ON c.id = fa.course_id
       LEFT JOIN subjects s ON s.id = fa.subject_id
       LEFT JOIN teachers t ON t.id = fa.teacher_id
       JOIN time_blocks tb ON tb.id = fa.time_block_id
       WHERE fa.campus_id = ? AND fa.is_active = 1`
    ).all(campusId) as Array<{ course: string | null; subject: string | null; teacher: string | null; day: number; idx: number | null; start_time: string; end_time: string; type: string; reason: string | null }>;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      forced.map((f) => ({
        Curso: f.course ?? "",
        Materia: f.subject ?? "",
        Docente: f.teacher ?? "",
        Día: DAY_NAMES[f.day] ?? f.day,
        Bloque: f.idx ?? "",
        Inicio: f.start_time,
        Fin: f.end_time,
        Tipo: f.type,
        Motivo: f.reason ?? "",
        Sede: campusName
      }))
    ), "Forzados opcional");

    const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new Response(out, {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="horaria_${campusName.toLowerCase().replace(/\s+/g, "_")}_export.xlsx"`
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
