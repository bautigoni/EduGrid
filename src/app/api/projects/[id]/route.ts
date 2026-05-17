import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { archiveProject, updateProject } from "@/server/repositories/projects";

const schema = z.object({
  campusId: z.string().min(1),
  name: z.string().min(1).optional(),
  type: z.enum(["PROJECT", "ELECTIVE", "OPTATIVE", "WORKSHOP", "CITIZENSHIP", "INTERDISCIPLINARY"]).optional(),
  description: z.string().optional(),
  fixed_time_block_id: z.string().nullable().optional(),
  weekly_blocks_required: z.number().int().min(1).max(20).optional(),
  flexible: z.boolean().optional(),
  notes: z.string().optional(),
  teacher_ids: z.array(z.string()).optional(),
  course_ids: z.array(z.string()).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const { id } = await params;
    const body = schema.parse(await request.json());
    requireCampusAccess(user, body.campusId);
    const { campusId, ...data } = body;
    const updated = updateProject(id, campusId, data as never);
    if (!updated) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const campusId = new URL(request.url).searchParams.get("campusId");
    if (!campusId) return NextResponse.json({ message: "campusId requerido" }, { status: 400 });
    requireCampusAccess(user, campusId);
    const { id } = await params;
    archiveProject(id, campusId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
