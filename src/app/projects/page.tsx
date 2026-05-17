import { AppShell } from "@/components/layout/app-shell";
import { ProjectsClient } from "@/components/projects/projects-client";
import { getScopedDemoContext } from "@/lib/demo-scope";
import { getProjectsByCampus } from "@/server/repositories/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const data = await getScopedDemoContext();
  const projects = data.selectedCampusId ? getProjectsByCampus(data.selectedCampusId) : [];
  return (
    <AppShell title="Proyectos, electivas y optativas" subtitle="Coordiná bloques especiales con docentes y cursos simultáneos.">
      <ProjectsClient
        initialProjects={projects}
        teachers={data.teachers}
        courses={data.courses}
        timeBlocks={data.assignableBlocks}
        campusId={data.selectedCampusId}
        canEdit={data.user.role !== "VIEWER"}
      />
    </AppShell>
  );
}
