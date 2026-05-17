import { AppShell } from "@/components/layout/app-shell";
import { TeachersClient } from "@/components/teachers/teachers-client";
import { getScopedDemoContext } from "@/lib/demo-scope";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const data = await getScopedDemoContext();
  return (
    <AppShell title="Docentes" subtitle="Gestioná materias, años habilitados, carga horaria y disponibilidad por docente.">
      <TeachersClient
        initialTeachers={data.teachers}
        subjects={data.subjects}
        courses={data.courses}
        timeBlocks={data.assignableBlocks}
        campusId={data.selectedCampusId}
        canEdit={data.user.role !== "VIEWER"}
      />
    </AppShell>
  );
}
