import { NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { clearFailedGenerationByCampus, clearSchedulesByCampus } from "@/server/repositories/testTools";

const schema = z.object({
  campusId: z.string().optional(),
  action: z.enum(["discard_failed", "clear_generated"])
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "CAMPUS_ADMIN", "SCHEDULER", "COORDINADOR_HORARIOS"]);
    const body = schema.parse(await request.json());
    const campusId = body.campusId ?? getDefaultCampusId(user);
    if (!campusId) return NextResponse.json({ message: "No hay sede seleccionada." }, { status: 400 });
    requireCampusAccess(user, campusId);
    if (body.action === "discard_failed") {
      return NextResponse.json({ ok: true, ...clearFailedGenerationByCampus(campusId) });
    }
    clearSchedulesByCampus(campusId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
