import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireRole } from "@/lib/access-control";
import { archiveCampus, getCampusById, updateCampus } from "@/server/repositories/campuses";

const schema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  display_name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  is_active: z.union([z.number(), z.boolean()]).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    const { id } = await params;
    const body = schema.parse(await request.json());
    if (typeof body.is_active === "boolean") body.is_active = body.is_active ? 1 : 0;
    const updated = updateCampus(id, body as never);
    if (!updated) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    const { id } = await params;
    if (!getCampusById(id)) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    archiveCampus(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
