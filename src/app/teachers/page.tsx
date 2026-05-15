import { AppShell } from "@/components/layout/app-shell";
import { TeachersClient } from "@/components/teachers/teachers-client";
import { getScopedDemoContext } from "@/lib/demo-scope";

export default async function TeachersPage() {
  const data = await getScopedDemoContext();
  return (
    <AppShell title="Docentes" subtitle="Gestioná materias, años habilitados, carga horaria y disponibilidad por docente.">
      <TeachersClient
        initialTeachers={data.teachers}
        subjectsCatalog={data.subjects.map(({ id, name }) => ({ id, name }))}
        coursesCatalog={data.courses.map(({ id, label, year }) => ({ id, label, year }))}
        campusId={data.selectedCampusId}
        canEdit={data.user.role !== "VIEWER"}
      />
    </AppShell>
  );
}
