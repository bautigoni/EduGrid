"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock3, GraduationCap, Layers3, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import type { ScheduleAssignmentRow } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

type Teacher = { id: string; full_name: string; contractual_weekly_minutes: number };
type Course = { id: string; name: string };
type Subject = { id: string; name: string; color: string | null };
type TimeBlock = { id: string; day_of_week: number; block_index: number; label: string; start_time: string; type: string; is_assignable: number };
type Conflict = { severity: "CRITICAL" | "WARNING" | "INFO" };
type Requirement = { course_id: string; subject_id: string; weekly_blocks_required: number; course_name: string; subject_name: string };

const COLORS = {
  regular: "#FDBA74",
  project: "#A7F3D0",
  institutional: "#86EFAC",
  pending: "#E2E8F0",
  warning: "#F59E0B",
  danger: "#E11D48",
  text: "#111827"
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

export function AnalyticsClient({
  entries,
  teachers,
  courses,
  subjects,
  timeBlocks,
  conflicts,
  requirements
}: {
  entries: ScheduleAssignmentRow[];
  teachers: Teacher[];
  courses: Course[];
  subjects: Subject[];
  timeBlocks: TimeBlock[];
  conflicts: Conflict[];
  requirements: Requirement[];
}) {
  const regularEntries = entries.filter((entry) => entry.assignment_type === "REGULAR_CLASS");
  const institutionalEntries = entries.filter((entry) => entry.assignment_type === "INSTITUTIONAL_HOUR");
  const projectEntries = entries.filter((entry) => entry.assignment_type !== "REGULAR_CLASS" && entry.assignment_type !== "INSTITUTIONAL_HOUR");
  const requiredBlocks = requirements.reduce((sum, requirement) => sum + requirement.weekly_blocks_required, 0);
  const assignedTeachingBlocks = regularEntries.length + projectEntries.length;
  const completion = requiredBlocks > 0 ? Math.round(Math.min(100, (regularEntries.length / requiredBlocks) * 100)) : 0;
  const critical = conflicts.filter((conflict) => conflict.severity === "CRITICAL").length;
  const warnings = conflicts.filter((conflict) => conflict.severity === "WARNING").length;

  const distribution = [
    { name: "Clases regulares", value: regularEntries.length, color: COLORS.regular },
    { name: "Proyectos", value: projectEntries.length, color: COLORS.project },
    { name: "Horas institucionales", value: institutionalEntries.length, color: COLORS.institutional }
  ].filter((item) => item.value > 0);

  const teacherLoad = teachers.map((teacher) => {
    const teacherEntries = entries.filter((entry) => entry.teacher_id === teacher.id);
    const frente = teacherEntries.filter((entry) => entry.assignment_type === "REGULAR_CLASS" || (entry.course_id && entry.assignment_type !== "INSTITUTIONAL_HOUR")).length;
    const institucional = teacherEntries.filter((entry) => entry.assignment_type === "INSTITUTIONAL_HOUR").length;
    const contractual = Math.round((teacher.contractual_weekly_minutes || 0) / 60);
    const total = frente + institucional;
    return {
      name: teacher.full_name,
      corto: teacher.full_name.split(" ").slice(0, 2).join(" "),
      contractual,
      frente,
      institucional,
      pendiente: Math.max(0, contractual - total),
      excedida: Math.max(0, total - contractual)
    };
  });

  const courseLoad = courses.map((course) => {
    const courseEntries = entries.filter((entry) => entry.course_id === course.id);
    const required = requirements.filter((req) => req.course_id === course.id).reduce((sum, req) => sum + req.weekly_blocks_required, 0);
    const regular = courseEntries.filter((entry) => entry.assignment_type === "REGULAR_CLASS").length;
    const project = courseEntries.filter((entry) => entry.assignment_type !== "REGULAR_CLASS" && entry.assignment_type !== "INSTITUTIONAL_HOUR").length;
    return {
      name: course.name,
      regular,
      proyectos: project,
      pendiente: Math.max(0, required - regular)
    };
  });

  const blockDistribution = timeBlocks
    .filter((block) => block.is_assignable)
    .map((block) => ({
      name: block.label,
      bloque: `B${block.block_index}`,
      asignaciones: entries.filter((entry) => entry.time_block_id === block.id).length
    }))
    .reduce<Array<{ name: string; bloque: string; asignaciones: number }>>((acc, item) => {
      const found = acc.find((row) => row.name === item.name);
      if (found) found.asignaciones += item.asignaciones;
      else acc.push(item);
      return acc;
    }, []);

  const subjectRanking = subjects
    .map((subject) => ({
      name: subject.name,
      blocks: regularEntries.filter((entry) => entry.subject_id === subject.id).length
    }))
    .filter((item) => item.blocks > 0)
    .sort((a, b) => b.blocks - a.blocks)
    .slice(0, 8);

  const maxHeat = Math.max(1, ...timeBlocks.map((block) => entries.filter((entry) => entry.time_block_id === block.id).length));
  const assignableRows = [...new Map(timeBlocks.filter((block) => block.is_assignable).map((block) => [block.block_index, block])).values()]
    .sort((a, b) => a.block_index - b.block_index);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Completitud" value={`${completion}%`} detail={`${regularEntries.length}/${requiredBlocks || regularEntries.length} bloques requeridos`} icon={CheckCircle2} tone="bg-emerald-500" />
        <StatCard label="Bloques asignados" value={String(entries.length)} detail={`${institutionalEntries.length} institucionales`} icon={Layers3} tone="bg-orange-500" />
        <StatCard label="Docentes" value={String(teachers.length)} detail={`${teacherLoad.filter((t) => t.pendiente > 0).length} con carga incompleta`} icon={Users} tone="bg-teal-500" />
        <StatCard label="Conflictos" value={String(critical)} detail={`${warnings} advertencias`} icon={AlertTriangle} tone="bg-amber-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ChartCard title="Distribución por tipo" subtitle="Bloques del horario activo.">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                {distribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Carga por docente" subtitle="Contractual, frente a curso, institucional y pendiente.">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={teacherLoad} margin={{ left: 0, right: 8, top: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="corto" interval={0} angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="frente" stackId="load" name="Frente a curso" fill={COLORS.regular} radius={[6, 6, 0, 0]} />
              <Bar dataKey="institucional" stackId="load" name="Institucional" fill={COLORS.institutional} radius={[6, 6, 0, 0]} />
              <Bar dataKey="pendiente" stackId="load" name="Pendiente" fill={COLORS.pending} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Carga por curso" subtitle="Bloques regulares, proyectos y pendientes.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseLoad} margin={{ left: 0, right: 8, top: 8, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="regular" stackId="course" name="Regulares" fill={COLORS.regular} />
              <Bar dataKey="proyectos" stackId="course" name="Proyectos" fill={COLORS.project} />
              <Bar dataKey="pendiente" stackId="course" name="Pendiente" fill={COLORS.pending} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución por bloque" subtitle="Cuántas clases caen en cada franja horaria.">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={blockDistribution} margin={{ left: 0, right: 12, top: 8, bottom: 24 }}>
              <defs>
                <linearGradient id="blockFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.project} stopOpacity={0.85} />
                  <stop offset="95%" stopColor={COLORS.project} stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bloque" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="asignaciones" name="Asignaciones" stroke="#10B981" fill="url(#blockFill)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ChartCard title="Heatmap semanal" subtitle="Ocupación por día y bloque.">
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[90px_repeat(5,1fr)] gap-2 text-xs font-semibold text-muted-foreground">
                <div />
                {DAYS.map((day) => <div key={day} className="text-center">{day}</div>)}
              </div>
              <div className="mt-2 space-y-2">
                {assignableRows.map((row) => (
                  <div key={row.block_index} className="grid grid-cols-[90px_repeat(5,1fr)] gap-2">
                    <div className="flex items-center text-xs font-semibold text-muted-foreground">{row.label}</div>
                    {DAYS.map((_, day) => {
                      const block = timeBlocks.find((item) => item.day_of_week === day && item.block_index === row.block_index && item.is_assignable);
                      const count = block ? entries.filter((entry) => entry.time_block_id === block.id).length : 0;
                      const intensity = count / maxHeat;
                      return (
                        <div
                          key={`${row.block_index}-${day}`}
                          className="flex min-h-11 items-center justify-center rounded-xl border text-xs font-bold"
                          style={{ backgroundColor: `rgba(16,185,129,${0.08 + intensity * 0.55})` }}
                          aria-label={`${DAYS[day]} ${row.label}: ${count} asignaciones`}
                        >
                          {count}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Rankings operativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Ranking title="Más carga frente a curso" items={teacherLoad.sort((a, b) => b.frente - a.frente).slice(0, 5).map((t) => [t.name, t.frente])} />
            <Ranking title="Más horas institucionales" items={teacherLoad.sort((a, b) => b.institucional - a.institucional).slice(0, 5).map((t) => [t.name, t.institucional])} />
            <Ranking title="Materias con más carga" items={subjectRanking.map((s) => [s.name, s.blocks])} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Ranking({ title, items }: { title: string; items: Array<[string, number]> }) {
  const max = Math.max(1, ...items.map(([, value]) => value));
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <Badge>{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin datos todavía.</p>
        ) : items.map(([label, value]) => (
          <div key={`${title}-${label}`} className="rounded-xl border bg-background/70 p-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold">{label}</span>
              <span>{value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", value === 0 ? "bg-muted" : "bg-primary")} style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
