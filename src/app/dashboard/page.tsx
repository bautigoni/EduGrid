import { AlertTriangle, CalendarCheck, DoorOpen, GraduationCap, Layers3, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { GenerationPanel } from "@/components/scheduler/generation-panel";
import { ScheduleCalendar } from "@/components/scheduler/schedule-calendar";
import { classrooms, conflicts, courses, importBatches, programBlocks, scheduleEntries, teachers } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell title="Panel" subtitle="Monitoreá sedes, conflictos, imports y estado de generación.">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Docentes" value={teachers.length.toString()} detail="Con disponibilidad por sede" icon={Users} tone="bg-orange-500" />
          <StatCard label="Cursos" value={courses.length.toString()} detail="Divisiones multisede" icon={GraduationCap} tone="bg-sky-500" />
          <StatCard label="Aulas" value={classrooms.length.toString()} detail="Compatibilidad por tipo" icon={DoorOpen} tone="bg-violet-500" />
          <StatCard label="Asignados" value={scheduleEntries.length.toString()} detail="Version activa" icon={CalendarCheck} tone="bg-green-500" />
          <StatCard label="Conflictos" value={conflicts.length.toString()} detail="Con explicacion y sugerencias" icon={AlertTriangle} tone="bg-amber-500" />
          <StatCard label="Especiales" value={programBlocks.length.toString()} detail={`${importBatches.length} imports recientes`} icon={Layers3} tone="bg-lime-500" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <GenerationPanel />
            <ScheduleCalendar />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <InsightPanel />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
