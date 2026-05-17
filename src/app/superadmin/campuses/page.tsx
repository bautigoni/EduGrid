import { AppShell } from "@/components/layout/app-shell";
import { CampusesClient } from "@/components/superadmin/campuses-client";
import { getSessionUser } from "@/lib/auth";
import { getCampusesForUser } from "@/server/repositories/campuses";

export const dynamic = "force-dynamic";

export default async function CampusesPage() {
  const user = await getSessionUser();
  const campuses = user ? getCampusesForUser({ id: user.id, role: user.role }) : [];
  const isSuperadmin = user?.role === "SUPERADMIN";
  return (
    <AppShell title="Sedes" subtitle={isSuperadmin ? "Crear, editar o desactivar sedes." : "Tu sede asignada."}>
      <div className="p-4 sm:p-6 lg:p-8">
        <CampusesClient initialCampuses={campuses} canCreate={!!isSuperadmin} />
      </div>
    </AppShell>
  );
}
