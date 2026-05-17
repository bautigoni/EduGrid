import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { createForcedAssignment, getForcedAssignmentsByCampus } from "@/server/repositories/forcedAssignments";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusId = new URL(request.url).searchParams.get("campusId");
    if (!campusId) return NextResponse.json([]);
    requireCampusAccess(user, campusId);
    return NextResponse.json(getForcedAssignmentsByCampus(campusId));
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  campusId: z.string().min(1),
  course_id: z.string().nullable().optional(),
  subject_id: z.string().nullable().optional(),
  teacher_id: z.string().nullable().optional(),
  time_block_id: z.string().min(1),
  assignment_type: z.enum(["REGULAR_CLASS", "PROJECT", "ELECTIVE", "OPTATIVE", "INSTITUTIONAL_HOUR"]),
  reason: z.string().optional(),
  hard_override: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const body = schema.parse(await request.json());
    requireCampusAccess(user, body.campusId);

    // Hard guards even on hard_override.
    const db = getDb();
    const block = db.prepare("SELECT id, type, is_assignable FROM time_blocks WHERE id = ?").get(body.time_block_id) as { is_assignable: number; type: string } | undefined;
    if (!block || !block.is_assignable || block.type !== "CLASS") {
      return NextResponse.json({ message: "El bloque elegido no es asignable (es un recreo o no existe)." }, { status: 400 });
    }
    const warnings: string[] = [];
    if (!body.hard_override) {
      if (body.teacher_id) {
        const av = db
          .prepare("SELECT status FROM teacher_availability WHERE teacher_id = ? AND time_block_id = ?")
          .get(body.teacher_id, body.time_block_id) as { status: string } | undefined;
        if (av && av.status === "UNAVAILABLE") {
          return NextResponse.json({
            message: "El docente no está disponible en ese bloque. Activá 'hard override' para forzarlo igualmente.",
            blocker: "TEACHER_UNAVAILABLE"
          }, { status: 409 });
        }
        if (body.subject_id && body.course_id) {
          const ok = db
            .prepare("SELECT 1 FROM teacher_subject_course_eligibility WHERE teacher_id = ? AND subject_id = ? AND course_id = ?")
            .get(body.teacher_id, body.subject_id, body.course_id);
          if (!ok) {
            return NextResponse.json({
              message: "El docente no está habilitado para esa materia en ese curso. Activá 'hard override' para forzarlo igualmente.",
              blocker: "TEACHER_NOT_ELIGIBLE"
            }, { status: 409 });
          }
        }
      }
    } else {
      if (body.teacher_id) {
        const av = db
          .prepare("SELECT status FROM teacher_availability WHERE teacher_id = ? AND time_block_id = ?")
          .get(body.teacher_id, body.time_block_id) as { status: string } | undefined;
        if (av && av.status === "UNAVAILABLE") {
          warnings.push("Asignación forzada fuera de disponibilidad docente.");
        }
        if (body.subject_id && body.course_id) {
          const ok = db
            .prepare("SELECT 1 FROM teacher_subject_course_eligibility WHERE teacher_id = ? AND subject_id = ? AND course_id = ?")
            .get(body.teacher_id, body.subject_id, body.course_id);
          if (!ok) warnings.push("Asignación forzada con docente no habilitado para esta materia/curso.");
        }
      }
    }

    const { campusId, ...rest } = body;
    const created = createForcedAssignment(campusId, rest as never);
    return NextResponse.json({ ...created, warnings }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
