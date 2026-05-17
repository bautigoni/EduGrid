import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireRole } from "@/lib/access-control";
import { deleteInvitation, setInvitationActive } from "@/server/repositories/invitationCodes";

const patchSchema = z.object({ is_active: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    setInvitationActive(id, body.is_active);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    const { id } = await params;
    deleteInvitation(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
