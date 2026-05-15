import { AppShell } from "@/components/layout/app-shell";
import { ClassroomsClient } from "@/components/classrooms/classrooms-client";
import { getScopedDemoContext } from "@/lib/demo-scope";

export default async function ClassroomsPage() {
  const data = await getScopedDemoContext();
  return (
    <AppShell title="Aulas" subtitle="Gestioná capacidad, compatibilidad por tipo y restricciones.">
      <ClassroomsClient initialRooms={data.classrooms} campusId={data.selectedCampusId} canEdit={data.user.role !== "VIEWER"} />
    </AppShell>
  );
}
