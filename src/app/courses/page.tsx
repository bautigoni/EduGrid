import { AppShell } from "@/components/layout/app-shell";
import { CoursesClient } from "@/components/courses/courses-client";
import { getScopedDemoContext } from "@/lib/demo-scope";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const data = await getScopedDemoContext();
  return (
    <AppShell title="Cursos" subtitle="Creá años, divisiones y configurá materias, horas y disponibilidad por curso.">
      <CoursesClient
        initialCourses={data.courses}
        subjects={data.subjects}
        timeBlocks={data.assignableBlocks}
        campusId={data.selectedCampusId}
        canEdit={data.user.role !== "VIEWER"}
      />
    </AppShell>
  );
}
