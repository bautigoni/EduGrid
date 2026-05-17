import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { Card, CardContent } from "@/components/ui/card";
import { getScopedDemoContext } from "@/lib/demo-scope";
import { getLatestScheduleConflicts, getLatestScheduleForCampus } from "@/lib/scheduler";
import { getCourseSubjectRequirements } from "@/server/repositories/courses";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getScopedDemoContext();
  const entries = data.selectedCampusId ? getLatestScheduleForCampus(data.selectedCampusId) : [];
  const conflicts = data.selectedCampusId ? getLatestScheduleConflicts(data.selectedCampusId) : [];
  const requirements = data.courses.flatMap((course) =>
    getCourseSubjectRequirements(course.id).map((requirement) => ({
      ...requirement,
      course_name: course.name,
      subject_name: data.subjects.find((subject) => subject.id === requirement.subject_id)?.name ?? requirement.subject_id
    }))
  );

  return (
    <AppShell title="Analítica" subtitle="Lectura operativa del horario activo y la carga pedagógica.">
      {entries.length === 0 ? (
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="soft-gradient">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl">◎</div>
              <h2 className="text-xl font-bold">Todavía no hay datos analíticos.</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Generá un horario en Planner para ver carga docente, ocupación semanal, conflictos y distribución de bloques.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <AnalyticsClient
          entries={entries}
          teachers={data.teachers}
          courses={data.courses}
          subjects={data.subjects}
          timeBlocks={data.timeBlocks}
          conflicts={conflicts}
          requirements={requirements}
        />
      )}
    </AppShell>
  );
}
