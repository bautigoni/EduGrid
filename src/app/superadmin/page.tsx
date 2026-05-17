import Link from "next/link";
import { Building2, KeyRound, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllCampuses } from "@/server/repositories/campuses";
import { getAllInvitationCodes } from "@/server/repositories/invitationCodes";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function SuperadminPage() {
  const campuses = getAllCampuses();
  const codes = getAllInvitationCodes();
  const usersCount = (getDb().prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c;

  return (
    <AppShell title="Superadmin" subtitle="Control global de sedes, usuarios y códigos de invitación.">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Sedes" value={String(campuses.length)} detail="Activas en la institución" icon={Building2} tone="bg-orange-500" />
          <StatCard label="Códigos de invitación" value={String(codes.length)} detail="Activos e inactivos" icon={KeyRound} tone="bg-amber-500" />
          <StatCard label="Usuarios" value={String(usersCount)} detail="Cuentas registradas" icon={Users} tone="bg-green-500" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Atajos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild><Link href="/superadmin/campuses">Gestionar sedes</Link></Button>
            <Button asChild variant="secondary"><Link href="/superadmin/invitation-codes">Códigos de invitación</Link></Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
