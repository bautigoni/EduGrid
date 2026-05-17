import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionToken, sessionCookie, shouldUseSecureCookies } from "@/lib/auth";
import { getInvitationByCode, incrementInvitationUsage } from "@/server/repositories/invitationCodes";
import { assignUserToCampus, createUser, getUserByEmail } from "@/server/repositories/users";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  invitationCode: z.string().min(4),
  message: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos incompletos o inválidos." }, { status: 400 });
  }
  const payload = parsed.data;
  const code = payload.invitationCode.trim().toUpperCase();
  const invitation = getInvitationByCode(code);

  if (!invitation) return NextResponse.json({ message: "Código de invitación inválido o vencido." }, { status: 400 });
  if (!invitation.is_active) return NextResponse.json({ message: "Este código de invitación está deshabilitado." }, { status: 400 });
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ message: "Este código de invitación venció." }, { status: 400 });
  }
  if (invitation.max_uses != null && invitation.used_count >= invitation.max_uses) {
    return NextResponse.json({ message: "Este código ya fue utilizado." }, { status: 400 });
  }

  const email = payload.email.trim().toLowerCase();
  if (getUserByEmail(email)) {
    return NextResponse.json({ message: "Ya existe una cuenta con ese email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const requiresApproval = !!invitation.requires_approval;
  const status = requiresApproval ? "PENDING_APPROVAL" : "ACTIVE";
  const user = createUser({
    full_name: payload.fullName,
    email,
    password_hash: passwordHash,
    role: invitation.role,
    status
  });
  if (invitation.campus_id) assignUserToCampus(user.id, invitation.campus_id);
  incrementInvitationUsage(invitation.id);

  if (status !== "ACTIVE") {
    return NextResponse.json({ id: user.id, status, redirectTo: "/pending-approval" }, { status: 201 });
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role as never,
    status: "ACTIVE",
    selectedCampusId: invitation.campus_id ?? null,
    campusIds: invitation.campus_id ? [invitation.campus_id] : []
  });
  const response = NextResponse.json({ id: user.id, status, redirectTo: "/planner" }, { status: 201 });
  response.cookies.set({
    name: sessionCookie,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
