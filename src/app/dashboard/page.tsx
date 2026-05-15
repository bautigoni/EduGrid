import { AlertTriangle, CalendarCheck, DoorOpen, GraduationCap, Layers3, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { GenerationPanel } from "@/components/scheduler/generation-panel";
import { ScheduleCalendar } from "@/components/scheduler/schedule-calendar";
import { getScopedDemoContext } from "@/lib/demo-scope";

export default async function DashboardPage() {
  const data = await getScopedDemoContext();
  const subtitle = data.isSuperadmin
    ? "Control global de sedes, conflictos, importaciones y generación."
    : `Panel operativo de ${data.campuses[0]?.name ?? "tu sede"}.`;

  return (
    <AppShell title="Panel" subtitle={subtitle}>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {data.isSuperadmin && <StatCard label="Sedes" value={data.campuses.length.toString()} detail="Activas en el sistema" icon={Layers3} tone="bg-lime-500" />}
          <StatCard label="Docentes" value={data.teachers.length.toString()} detail="Con disponibilidad cargada" icon={Users} tone="bg-orange-500" />
          <StatCard label="Cursos" value={data.courses.length.toString()} detail="Divisiones de la sede" icon={GraduationCap} tone="bg-sky-500" />
          <StatCard label="Aulas especiales" value={data.classrooms.length.toString()} detail="Solo para casos especiales" icon={DoorOpen} tone="bg-violet-500" />
          <StatCard label="Asignados" value={data.scheduleEntries.length.toString()} detail="Versión activa" icon={CalendarCheck} tone="bg-green-500" />
          <StatCard label="Conflictos" value={data.conflicts.length.toString()} detail="Con explicación y sugerencias" icon={AlertTriangle} tone="bg-amber-500" />
          <StatCard label="Especiales" value={data.programBlocks.length.toString()} detail={`${data.importBatches.length} imports recientes`} icon={Layers3} tone="bg-lime-500" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0 space-y-6">
            <GenerationPanel campusId={data.selectedCampusId} />
            <ScheduleCalendar initialEntries={data.scheduleEntries} />
          </div>
          <div className="min-w-0 space-y-6">
            <QuickActions />
            <InsightPanel insights={data.insights} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
