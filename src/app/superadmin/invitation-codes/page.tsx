import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { campuses, invitationCodes } from "@/lib/demo-data";
import { InvitationCodesClient } from "@/components/superadmin/invitation-codes-client";

export default async function InvitationCodesPage() {
  const campusList = campuses.map(({ id, name }) => ({ id, name }));
  return (
    <AppShell title="Códigos de invitación" subtitle="Creá y gestioná códigos para incorporar coordinadores y superadmins.">
      <div className="p-4 sm:p-6 lg:p-8">
        <InvitationCodesClient initialCodes={invitationCodes} campuses={campusList} />
      </div>
    </AppShell>
  );
}
