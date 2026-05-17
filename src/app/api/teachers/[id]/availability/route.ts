import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { getTeacherAvailability, saveTeacherAvailability } from "@/server/repositories/availability";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    return NextResponse.json(getTeacherAvailability(id));
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  campusId: z.string(),
  entries: z.array(z.object({ time_block_id: z.string(), status: z.enum(["AVAILABLE", "UNAVAILABLE"]) }))
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const { id } = await params;
    const body = schema.parse(await request.json());
    requireCampusAccess(user, body.campusId);
    saveTeacherAvailability(id, body.entries);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
