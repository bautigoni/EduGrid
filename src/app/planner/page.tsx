import { AppShell } from "@/components/layout/app-shell";
import { PlannerClient } from "@/components/planner/planner-client";
import { getScopedDemoContext } from "@/lib/demo-scope";

export default async function PlannerPage() {
  const data = await getScopedDemoContext();
  return (
    <AppShell title="Planner" subtitle="Generá, filtrá y exportá el horario semanal de tu sede.">
      <PlannerClient
        initialEntries={data.scheduleEntries}
        teachers={data.teachers.map((teacher) => teacher.fullName)}
        courses={data.courses.map((course) => course.label)}
        subjects={data.subjects.map((subject) => subject.name)}
        campusId={data.selectedCampusId}
      />
    </AppShell>
  );
}
