import { AppShell } from "@/components/layout/app-shell";
import { SubjectsClient } from "@/components/subjects/subjects-client";
import { getScopedDemoContext } from "@/lib/demo-scope";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const data = await getScopedDemoContext();
  return (
    <AppShell title="Materias" subtitle="Catálogo de materias. Las horas semanales se cargan dentro de cada curso.">
      <SubjectsClient
        initialSubjects={data.subjects}
        campusId={data.selectedCampusId}
        canEdit={data.user.role !== "VIEWER"}
      />
    </AppShell>
  );
}
