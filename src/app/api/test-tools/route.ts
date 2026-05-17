import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import {
  clearConflictsByCampus,
  clearCourseAvailabilityByCampus,
  clearCoursesByCampus,
  clearProjectsByCampus,
  clearFailedGenerationByCampus,
  clearSchedulesByCampus,
  clearSubjectsByCampus,
  clearTeacherAvailabilityByCampus,
  clearTeacherEligibilityByCampus,
  clearTeachersByCampus,
  resetAllSystem,
  resetCampusData
} from "@/server/repositories/testTools";

const schema = z.object({
  action: z.enum([
    "courses",
    "teachers",
    "subjects",
    "teacher_availability",
    "course_availability",
    "teacher_eligibility",
    "projects",
    "schedules",
    "failed_generation",
    "conflicts",
    "reset_planner",
    "reset_campus",
    "reset_all"
  ]),
  confirm: z.string().min(1),
  campusId: z.string().optional()
});

const CONFIRMATIONS: Record<string, string> = {
  courses: "BORRAR CURSOS",
  teachers: "BORRAR DOCENTES",
  subjects: "BORRAR MATERIAS",
  teacher_availability: "BORRAR DISPONIBILIDAD DOCENTE",
  course_availability: "BORRAR DISPONIBILIDAD CURSOS",
  teacher_eligibility: "BORRAR HABILITACIONES",
  projects: "BORRAR PROYECTOS",
  schedules: "BORRAR HORARIOS",
  failed_generation: "DESCARTAR GENERACION FALLIDA",
  conflicts: "BORRAR CONFLICTOS",
  reset_planner: "REINICIAR PLANNER",
  reset_campus: "REINICIAR SEDE",
  reset_all: "BORRAR TODO"
};

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    const body = schema.parse(await request.json());
    if (body.confirm.trim().toUpperCase() !== CONFIRMATIONS[body.action]) {
      return NextResponse.json({ message: `Confirmación inválida. Escribí exactamente: ${CONFIRMATIONS[body.action]}` }, { status: 400 });
    }

    if (body.action === "reset_all") {
      // Only SUPERADMIN already enforced. No campus scope required.
      resetAllSystem();
      return NextResponse.json({ ok: true });
    }

    const campusId = body.campusId;
    if (!campusId) return NextResponse.json({ message: "campusId requerido para esta acción." }, { status: 400 });
    requireCampusAccess(user, campusId);

    switch (body.action) {
      case "courses": return NextResponse.json({ ok: true, ...clearCoursesByCampus(campusId) });
      case "teachers": return NextResponse.json({ ok: true, ...clearTeachersByCampus(campusId) });
      case "subjects": return NextResponse.json({ ok: true, ...clearSubjectsByCampus(campusId) });
      case "teacher_availability": return NextResponse.json({ ok: true, ...clearTeacherAvailabilityByCampus(campusId) });
      case "course_availability": return NextResponse.json({ ok: true, ...clearCourseAvailabilityByCampus(campusId) });
      case "teacher_eligibility": clearTeacherEligibilityByCampus(campusId); return NextResponse.json({ ok: true });
      case "projects": return NextResponse.json({ ok: true, ...clearProjectsByCampus(campusId) });
      case "schedules": clearSchedulesByCampus(campusId); return NextResponse.json({ ok: true });
      case "failed_generation": return NextResponse.json({ ok: true, ...clearFailedGenerationByCampus(campusId) });
      case "conflicts": return NextResponse.json({ ok: true, ...clearConflictsByCampus(campusId) });
      case "reset_planner": clearSchedulesByCampus(campusId); return NextResponse.json({ ok: true });
      case "reset_campus": resetCampusData(campusId); return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ message: "Acción desconocida." }, { status: 400 });
  } catch (error) {
    return jsonError(error);
  }
}
