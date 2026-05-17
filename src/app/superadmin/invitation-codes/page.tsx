import { AppShell } from "@/components/layout/app-shell";
import { InvitationCodesClient } from "@/components/superadmin/invitation-codes-client";
import { getAllCampuses } from "@/server/repositories/campuses";
import { getAllInvitationCodes } from "@/server/repositories/invitationCodes";

export const dynamic = "force-dynamic";

export default async function InvitationCodesPage() {
  const codes = getAllInvitationCodes().map((c) => ({
    id: c.id,
    code: c.code,
    campusId: c.campus_id,
    role: c.role,
    label: c.label ?? "",
    isActive: c.is_active === 1,
    expiresAt: c.expires_at,
    maxUses: c.max_uses,
    usedCount: c.used_count,
    requiresApproval: c.requires_approval === 1
  }));
  const campusList = getAllCampuses().map(({ id, name }) => ({ id, name }));
  return (
    <AppShell title="Códigos de invitación" subtitle="Creá y gestioná códigos para incorporar coordinadores y superadmins.">
      <div className="p-4 sm:p-6 lg:p-8">
        <InvitationCodesClient initialCodes={codes} campuses={campusList} />
      </div>
    </AppShell>
  );
}
