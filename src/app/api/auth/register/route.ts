import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { invitationCodes } from "@/lib/demo-data";
import { createSessionToken, sessionCookie, shouldUseSecureCookies } from "@/lib/auth";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  invitationCode: z.string().min(4),
  message: z.string().optional()
});

type CodeError = "INVALID" | "EXPIRED" | "USED" | "INACTIVE";

const errorMessages: Record<CodeError, string> = {
  INVALID: "Código de invitación inválido o vencido.",
  EXPIRED: "Este código de invitación venció.",
  USED: "Este código ya fue utilizado.",
  INACTIVE: "Este código de invitación está deshabilitado."
};

type DemoValidation = { error: CodeError | null; record?: (typeof invitationCodes)[number] };

function validateDemoCode(rawCode: string): DemoValidation {
  const code = rawCode.trim().toUpperCase();
  const record = invitationCodes.find((entry) => entry.code === code);
  if (!record) return { error: "INVALID" };
  if (!record.isActive) return { error: "INACTIVE" };
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) return { error: "EXPIRED" };
  if (record.maxUses != null && record.usedCount >= record.maxUses) return { error: "USED" };
  return { error: null, record };
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos incompletos o inválidos." }, { status: 400 });
  }
  const payload = parsed.data;

  try {
    const { prisma } = await import("@/lib/prisma");
    const code = payload.invitationCode.trim().toUpperCase();
    // Prefer the real DB record but fall back to the demo list when running without a database.
    let invitation: any = null;
    try {
      invitation = await (prisma as any).invitationCode?.findFirst({ where: { code } });
    } catch {
      invitation = null;
    }
    let codeError: CodeError | null = null;
    let campusId: string | null = null;
    let role: "SUPERADMIN" | "COORDINADOR_HORARIOS" = "COORDINADOR_HORARIOS";
    let requiresApproval = false;

    if (invitation) {
      if (!invitation.isActive) codeError = "INACTIVE";
      else if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) codeError = "EXPIRED";
      else if (invitation.maxUses != null && invitation.usedCount >= invitation.maxUses) codeError = "USED";
      else {
        campusId = invitation.campusId;
        role = invitation.role;
        requiresApproval = invitation.requiresApproval;
      }
    } else {
      const demoResult = validateDemoCode(payload.invitationCode);
      if (demoResult.error) {
        codeError = demoResult.error;
      } else if (demoResult.record) {
        campusId = demoResult.record.campusId;
        role = demoResult.record.role as typeof role;
        requiresApproval = demoResult.record.requiresApproval;
      }
    }

    if (codeError) {
      return NextResponse.json({ message: errorMessages[codeError] }, { status: 400 });
    }

    // Map the simplified role onto the legacy enum used by older user records.
    const legacyRole = role === "SUPERADMIN" ? "SUPERADMIN" : "SCHEDULER";
    const status = requiresApproval ? "PENDING_APPROVAL" : "ACTIVE";

    let userId = "demo-registration";
    try {
      const user = await prisma.user.create({
        data: {
          name: payload.fullName,
          email: payload.email,
          passwordHash: await bcrypt.hash(payload.password, 12),
          role: legacyRole as never,
          status: status as never,
          selectedCampusId: campusId ?? undefined,
          campuses: campusId
            ? {
                create: [
                  {
                    campusId,
                    role: legacyRole as never,
                    canApproveUsers: role === "SUPERADMIN"
                  }
                ]
              }
            : undefined,
          registrationRequest: requiresApproval
            ? {
                create: {
                  fullName: payload.fullName,
                  email: payload.email,
                  institutionName: "—",
                  requestedCampus: campusId ?? "—",
                  campusId: campusId ?? undefined,
                  requestedRole: legacyRole as never,
                  message: payload.message
                }
              }
            : undefined
        }
      });
      userId = user.id;
      if (invitation) {
        try {
          await (prisma as any).invitationCode.update({
            where: { id: invitation.id },
            data: { usedCount: (invitation.usedCount ?? 0) + 1 }
          });
        } catch {
          /* ignore */
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return NextResponse.json({ message: "Ya existe una cuenta con ese email." }, { status: 409 });
      }
      // Fall through to demo mode if DB isn't available.
    }

    if (status === "ACTIVE") {
      const token = await createSessionToken({
        id: userId,
        email: payload.email,
        name: payload.fullName,
        role: legacyRole as never,
        status: "ACTIVE",
        selectedCampusId: campusId,
        campusIds: campusId ? [campusId] : []
      });
      const response = NextResponse.json({ id: userId, status: "ACTIVE", redirectTo: "/planner" }, { status: 201 });
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

    return NextResponse.json({ id: userId, status: "PENDING_APPROVAL", redirectTo: "/pending-approval" }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ message: "Ya existe una cuenta con ese email." }, { status: 409 });
    }
    return NextResponse.json({ message: "No se pudo crear la cuenta. Verificá el código." }, { status: 500 });
  }
}
