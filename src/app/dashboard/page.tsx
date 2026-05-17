import { AlertTriangle, BarChart3, CalendarDays, CheckCircle2, GraduationCap, Layers3, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { GenerationRecoveryCard } from "@/components/planner/generation-recovery-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScopedDemoContext } from "@/lib/demo-scope";
import { getLatestScheduleConflicts, getLatestScheduleForCampus, getLatestScheduleVersionMeta } from "@/lib/scheduler";
import { getCourseSubjectRequirements } from "@/server/repositories/courses";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getScopedDemoContext();
  const conflicts = data.selectedCampusId ? getLatestScheduleConflicts(data.selectedCampusId) : [];
  const entries = data.selectedCampusId ? getLatestScheduleForCampus(data.selectedCampusId) : [];
  const latestVersion = data.selectedCampusId ? getLatestScheduleVersionMeta(data.selectedCampusId) : null;
  const critical = conflicts.filter((c) => c.severity === "CRITICAL").length;
  const warnings = conflicts.filter((c) => c.severity === "WARNING").length;
  const requiredBlocks = data.courses.flatMap((course) => getCourseSubjectRequirements(course.id)).reduce((sum, req) => sum + req.weekly_blocks_required, 0);
  const regularBlocks = entries.filter((entry) => entry.assignment_type === "REGULAR_CLASS").length;
  const institutional = entries.filter((entry) => entry.assignment_type === "INSTITUTIONAL_HOUR").length;
  const completion = requiredBlocks > 0 ? Math.round(Math.min(100, (regularBlocks / requiredBlocks) * 100)) : 0;
  const teacherLoad = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.teacher_id) continue;
    teacherLoad.set(entry.teacher_id, (teacherLoad.get(entry.teacher_id) ?? 0) + 1);
  }
  const incompleteTeachers = data.teachers.filter((teacher) => {
    const cap = Math.round((teacher.contractual_weekly_minutes || 0) / 60);
    return cap > 0 && (teacherLoad.get(teacher.id) ?? 0) < cap;
  }).length;

  return (
    <AppShell title="Panel" subtitle={data.isSuperadmin ? "Control global." : `Mesa de control de ${data.campuses[0]?.name ?? "tu sede"}.`}>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {data.selectedCampusId && latestVersion && !["COMPLETED", "PARTIAL"].includes(latestVersion.status) && (
          <GenerationRecoveryCard campusId={data.selectedCampusId} status={latestVersion.status} />
        )}
        <Card className="soft-gradient overflow-hidden">
          <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-6">
            <div>
              <div className="inline-flex rounded-full border bg-white/75 px-3 py-1 text-xs font-bold text-emerald-800">
                {latestVersion ? `Última versión: ${latestVersion.status}` : "Sin horario activo"}
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                {completion > 0 ? `${completion}% de la carga regular cubierta` : "Listo para generar el primer horario"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
                {critical > 0
                  ? "Hay conflictos críticos para resolver antes de cerrar el horario."
                  : entries.length > 0
                    ? "El horario activo está disponible para filtrar, exportar y analizar."
                    : "Importá datos o revisá la carga inicial desde Planner."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button asChild>
                <Link href="/planner"><CalendarDays className="h-4 w-4" /> Ir a Planner</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/analytics"><BarChart3 className="h-4 w-4" /> Ver analítica</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.isSuperadmin && (
            <StatCard label="Sedes" value={String(data.campuses.length)} detail="Activas" icon={Layers3} tone="bg-lime-500" />
          )}
          <StatCard label="Cursos" value={String(data.courses.length)} detail={`${requiredBlocks} bloques requeridos`} icon={GraduationCap} tone="bg-emerald-500" />
          <StatCard label="Docentes" value={String(data.teachers.length)} detail={`${incompleteTeachers} con carga incompleta`} icon={Users} tone="bg-orange-500" />
          <StatCard label="Horario activo" value={String(entries.length)} detail={`${institutional} horas institucionales`} icon={CheckCircle2} tone="bg-teal-500" />
          <StatCard label="Conflictos" value={String(critical)} detail={`${warnings} advertencias`} icon={AlertTriangle} tone="bg-amber-500" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Próximos pasos sugeridos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                critical > 0 ? "Revisar conflictos críticos en Planner." : "Validar la vista por curso antes de exportar.",
                incompleteTeachers > 0 ? "Completar o ajustar carga de docentes incompletos." : "Revisar distribución de carga docente.",
                entries.length === 0 ? "Generar horario o probar generación sin guardar." : "Abrir Analítica para revisar ocupación semanal."
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl border bg-background/70 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary font-bold text-emerald-900">{index + 1}</div>
                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <QuickActions />
        </div>
      </div>
    </AppShell>
  );
}
