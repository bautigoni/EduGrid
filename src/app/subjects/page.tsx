import { AppShell } from "@/components/layout/app-shell";
import { SubjectsClient } from "@/components/subjects/subjects-client";
import { getScopedDemoContext } from "@/lib/demo-scope";

export default async function SubjectsPage() {
  const data = await getScopedDemoContext();
  return (
    <AppShell title="Materias" subtitle="Catálogo simple de materias. Las horas semanales se cargan dentro de cada curso.">
      <SubjectsClient initialSubjects={data.subjects} canEdit={data.user.role !== "VIEWER"} />
    </AppShell>
  );
}
