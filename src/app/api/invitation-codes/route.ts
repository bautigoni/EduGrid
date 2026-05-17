import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireRole } from "@/lib/access-control";
import { createInvitationCode, getAllInvitationCodes } from "@/server/repositories/invitationCodes";

export async function GET() {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    return NextResponse.json(getAllInvitationCodes());
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  code: z.string().min(4),
  campus_id: z.string().nullable().optional(),
  role: z.enum(["SUPERADMIN", "COORDINADOR_HORARIOS"]),
  label: z.string().optional(),
  expires_at: z.string().nullable().optional(),
  max_uses: z.number().int().nullable().optional(),
  requires_approval: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    const data = schema.parse(await request.json());
    const code = createInvitationCode({
      code: data.code.trim().toUpperCase(),
      campus_id: data.role === "SUPERADMIN" ? null : data.campus_id ?? null,
      role: data.role,
      label: data.label,
      expires_at: data.expires_at ?? null,
      max_uses: data.max_uses ?? null,
      requires_approval: !!data.requires_approval
    });
    return NextResponse.json(code, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
