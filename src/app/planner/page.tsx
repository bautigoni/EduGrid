import { AppShell } from "@/components/layout/app-shell";
import { GenerationRecoveryCard } from "@/components/planner/generation-recovery-card";
import { PlannerClient } from "@/components/planner/planner-client";
import { getScopedDemoContext } from "@/lib/demo-scope";
import { getLatestScheduleConflicts, getLatestScheduleForCampus, getLatestScheduleVersionMeta } from "@/lib/scheduler";
import { getForcedAssignmentsByCampus } from "@/server/repositories/forcedAssignments";
import { getProjectsByCampus } from "@/server/repositories/projects";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const data = await getScopedDemoContext();
  const entries = data.selectedCampusId ? getLatestScheduleForCampus(data.selectedCampusId) : [];
  const conflicts = data.selectedCampusId ? getLatestScheduleConflicts(data.selectedCampusId) : [];
  const forced = data.selectedCampusId ? getForcedAssignmentsByCampus(data.selectedCampusId) : [];
  const projects = data.selectedCampusId ? getProjectsByCampus(data.selectedCampusId) : [];
  const latestVersion = data.selectedCampusId ? getLatestScheduleVersionMeta(data.selectedCampusId) : null;

  return (
    <AppShell title="Planner" subtitle="Genera, filtra y exporta el horario semanal de tu sede.">
      {data.selectedCampusId && latestVersion && !["COMPLETED", "PARTIAL"].includes(latestVersion.status) && (
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <GenerationRecoveryCard campusId={data.selectedCampusId} status={latestVersion.status} />
        </div>
      )}
      <PlannerClient
        initialEntries={entries}
        initialConflicts={conflicts}
        initialForced={forced}
        timeBlocks={data.timeBlocks}
        teachers={data.teachers}
        courses={data.courses}
        subjects={data.subjects}
        projects={projects.map((p) => ({ id: p.id, name: p.name, type: p.type }))}
        campusId={data.selectedCampusId}
        latestVersionStatus={latestVersion?.status ?? null}
      />
    </AppShell>
  );
}
