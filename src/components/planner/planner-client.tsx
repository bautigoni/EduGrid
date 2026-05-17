"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileDown, FileSpreadsheet, Info, Loader2, LockOpen, Pin, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FullScreenModal } from "@/components/ui/full-screen-modal";
import { cn } from "@/lib/utils";

type Severity = "CRITICAL" | "WARNING" | "INFO";

type Entry = {
  id: string;
  course_id?: string | null;
  course_name?: string | null;
  subject_id?: string | null;
  subject_name?: string | null;
  subject_color?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  time_block_id: string;
  day_of_week: number;
  block_index: number;
  start_time: string;
  end_time: string;
  assignment_type: string;
  title?: string | null;
  forced?: number;
};

type Conflict = {
  id: string;
  type: string;
  severity: Severity;
  message: string;
  suggestion: string | null;
  entity_type: string | null;
  entity_id: string | null;
  technical?: {
    course?: string;
    subject?: string;
    candidatesConsidered: number;
    eligibleTeachers: string[];
    validTimeBlocksBeforeConflicts: number;
    rejectedByReason: Record<string, number>;
    freeCourseBlocks?: string[];
    commonAvailableBlocks?: string[];
    blockingAssignments?: string[];
  };
};

type Forced = {
  id: string;
  course_id: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  time_block_id: string;
  assignment_type: string;
  reason: string | null;
  hard_override: number;
};

type TimeBlock = { id: string; day_of_week: number; block_index: number; start_time: string; end_time: string; duration_minutes: number; type: string; label: string; is_assignable: number };

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

const breakStyles: Record<string, string> = {
  BREAK: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  MINI_BREAK: "bg-amber-400/10 text-amber-700 dark:text-amber-300",
  LUNCH: "bg-orange-500/10 text-orange-700 dark:text-orange-300"
};

type ViewMode = "summary" | "course" | "teacher" | "subject" | "project";
type GenerationSummary = {
  coursesComplete: number;
  coursesWithPending: number;
  teachersComplete: number;
  teachersWithInstitutional: number;
  critical: number;
  warnings: number;
  pendingBlocks?: number;
  freeCourseBlocks?: number;
  teachersIncomplete?: number;
  institutionalHoursGenerated?: number;
  iterations?: number;
  assignments?: number;
};
type GenerationError = {
  status: string;
  message: string;
  diagnostics?: { durationMs: number; timedOut: boolean; iterations: number; technical: NonNullable<Conflict["technical"]>[] };
};

export function PlannerClient({
  initialEntries,
  initialConflicts,
  initialForced,
  timeBlocks,
  teachers,
  courses,
  subjects,
  projects,
  campusId,
  latestVersionStatus
}: {
  initialEntries: Entry[];
  initialConflicts: Conflict[];
  initialForced: Forced[];
  timeBlocks: TimeBlock[];
  teachers: Array<{ id: string; full_name: string }>;
  courses: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string; type: string }>;
  campusId: string;
  latestVersionStatus?: string | null;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [conflicts, setConflicts] = useState<Conflict[]>(initialConflicts);
  const [forced, setForced] = useState<Forced[]>(initialForced);
  const [summary, setSummary] = useState<null | GenerationSummary>(null);
  const [view, setView] = useState<ViewMode>("summary");
  const [filterId, setFilterId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [generationStep, setGenerationStep] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<GenerationError | null>(null);
  const [dryRunResult, setDryRunResult] = useState<GenerationError | null>(null);
  const [forceCell, setForceCell] = useState<null | { dayLabel: string; block: TimeBlock; existingEntries: Entry[] }>(null);
  const [preflight, setPreflight] = useState<null | { ok: boolean; blockers: string[]; warnings: string[]; counts?: Record<string, number> }>(null);
  const [seeding, setSeeding] = useState(false);
  const [showTechDiag, setShowTechDiag] = useState(false);
  const [diagnosticsFilter, setDiagnosticsFilter] = useState<"all" | "critical" | "warning">("all");

  const filterOptions =
    view === "course" ? courses.map((c) => ({ id: c.id, label: c.name }))
    : view === "teacher" ? teachers.map((t) => ({ id: t.id, label: t.full_name }))
    : view === "subject" ? subjects.map((s) => ({ id: s.id, label: s.name }))
    : view === "project" ? projects.map((p) => ({ id: p.id, label: p.name }))
    : [];

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (view === "course") {
      list = list.filter((e) => e.course_id === filterId && e.assignment_type !== "INSTITUTIONAL_HOUR");
    } else if (view === "teacher") {
      list = list.filter((e) => e.teacher_id === filterId);
    } else if (view === "subject") {
      list = list.filter((e) => e.subject_id === filterId);
    } else if (view === "project") {
      const project = projects.find((p) => p.id === filterId);
      if (project) {
        list = list.filter((e) => e.assignment_type === project.type && (e.title ?? "") === project.name);
      } else {
        list = [];
      }
    } else {
      list = [];
    }
    return list;
  }, [entries, view, filterId, projects]);

  const byCell = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of filteredEntries) {
      const k = `${e.day_of_week}|${e.time_block_id}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    for (const [k, list] of map) {
      const seen = new Set<string>();
      map.set(k, list.filter((e) => {
        const key = `${e.assignment_type}|${e.title ?? e.subject_name ?? ""}|${e.course_id ?? ""}|${view === "teacher" ? e.teacher_id ?? "" : ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
    }
    return map;
  }, [filteredEntries, view]);

  const rowMap = new Map<string, { type: string; label: string; start_time: string; end_time: string; perDay: TimeBlock[] }>();
  for (const b of timeBlocks) {
    const key = `${b.start_time}|${b.type}`;
    if (!rowMap.has(key)) rowMap.set(key, { type: b.type, label: b.label, start_time: b.start_time, end_time: b.end_time, perDay: [] });
    rowMap.get(key)!.perDay.push(b);
  }
  const rows = [...rowMap.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));

  async function runPreflight() {
    if (!campusId) return null;
    const res = await fetch(`/api/scheduler/check?campusId=${campusId}`);
    if (!res.ok) return null;
    const data = await res.json();
    setPreflight(data);
    return data;
  }
  async function seedBenchmark() {
    if (!campusId) return;
    if (!confirm("Esto reemplaza cursos, materias, docentes y disponibilidad de esta sede con el dataset de prueba (6 cursos, 20 docentes, 12 materias). ¿Continuar?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/scheduler/seed-benchmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId })
      });
      if (res.ok) {
        await runPreflight();
        router.refresh();
      }
    } finally {
      setSeeding(false);
    }
  }

  const generationSteps = [
    "Validando datos...",
    "Preparando restricciones...",
    "Calculando combinaciones...",
    "Asignando materias...",
    "Generando horas institucionales...",
    "Guardando horario...",
    "Generando diagnostico..."
  ];

  async function runGeneration(dryRun: boolean) {
    if (!campusId) return;
    setGenerationError(null);
    setDryRunResult(null);
    setGenerationStep(generationSteps[0]);
    const pf = await runPreflight();
    if (pf && pf.blockers.length > 0) {
      setGenerationError({
        status: "PRECHECK_FAILED",
        message: `Faltan datos para generar el horario: ${pf.blockers.join(" ")}`
      });
      setGenerationStep(null);
      return;
    }
    if (dryRun) setDryRunning(true);
    else setGenerating(true);
    const controller = new AbortController();
    const abortId = window.setTimeout(() => controller.abort(), 12_000);
    let stepIndex = 0;
    const stepId = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, generationSteps.length - 1);
      setGenerationStep(generationSteps[stepIndex]);
    }, 1200);
    try {
      const res = await fetch("/api/scheduler/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, dryRun }),
        signal: controller.signal
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerationError({ status: "FAILED", message: data.message ?? "No se pudo generar el horario." });
        return;
      }
      if (Array.isArray(data.conflicts)) {
        setConflicts(
          data.conflicts.map((c: { id?: string; type: string; severity: Severity; message: string; suggestion?: string; entity_type?: string | null; entity_id?: string | null; technical?: Conflict["technical"] }, i: number) => ({
            id: c.id ?? `tmp-${i}`,
            type: c.type,
            severity: c.severity,
            message: c.message,
            suggestion: c.suggestion ?? null,
            entity_type: c.entity_type ?? null,
            entity_id: c.entity_id ?? null,
            technical: c.technical
          }))
        );
      }
      if (data.summary) setSummary(data.summary);
      const resultState: GenerationError = {
        status: data.status,
        message: data.userMessage ?? (data.status === "SUCCESS" ? "Horario generado correctamente." : "No se pudo generar el horario. Revisa el diagnostico tecnico o ajusta los datos."),
        diagnostics: data.diagnostics
      };
      if (dryRun) {
        setDryRunResult(resultState);
      } else if (data.status === "SUCCESS" || data.status === "PARTIAL") {
        if (Array.isArray(data.entries)) setEntries(data.entries);
        setGenerationError(resultState);
        router.refresh();
      } else {
        setGenerationError(resultState);
        router.refresh();
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      setGenerationError({
        status: aborted ? "FAILED_TIMEOUT" : "FAILED",
        message: aborted
          ? "No se pudo completar la generacion dentro del tiempo maximo. Proba ampliar disponibilidad, reducir restricciones o revisar el diagnostico."
          : "No se pudo generar el horario. Revisa el diagnostico tecnico o ajusta los datos."
      });
    } finally {
      window.clearTimeout(abortId);
      window.clearInterval(stepId);
      setGenerationStep(null);
      setGenerating(false);
      setDryRunning(false);
    }
  }

  async function refreshForced() {
    const res = await fetch(`/api/forced-assignments?campusId=${campusId}`);
    if (res.ok) setForced(await res.json());
  }
  async function deleteForced(id: string) {
    if (!confirm("¿Quitar esta regla forzada?")) return;
    const res = await fetch(`/api/forced-assignments/${id}?campusId=${campusId}`, { method: "DELETE" });
    if (res.ok) await refreshForced();
  }

  const exportQuery = `campusId=${campusId}&filterType=${view === "summary" ? "all" : view === "project" ? "all" : view}&filterId=${encodeURIComponent(filterId)}`;
  const counts = useMemo(() => ({
    critical: conflicts.filter((c) => c.severity === "CRITICAL").length,
    warnings: conflicts.filter((c) => c.severity === "WARNING").length
  }), [conflicts]);

  const activeScheduleStats = useMemo(() => {
    const courseIds = new Set(entries.filter((e) => e.course_id && e.assignment_type !== "INSTITUTIONAL_HOUR").map((e) => e.course_id));
    const teacherIds = new Set(entries.filter((e) => e.teacher_id).map((e) => e.teacher_id));
    return {
      assignedBlocks: entries.length,
      regularBlocks: entries.filter((e) => e.assignment_type === "REGULAR_CLASS").length,
      projectBlocks: entries.filter((e) => e.assignment_type !== "REGULAR_CLASS" && e.assignment_type !== "INSTITUTIONAL_HOUR").length,
      institutionalBlocks: entries.filter((e) => e.assignment_type === "INSTITUTIONAL_HOUR").length,
      coursesWithSchedule: courseIds.size,
      teachersWithSchedule: teacherIds.size,
      forcedBlocks: entries.filter((e) => e.forced).length
    };
  }, [entries]);

  const totalMinutesShown = useMemo(() => {
    if (view !== "teacher" || !filterId) return null;
    let mins = 0;
    for (const e of filteredEntries) {
      const block = timeBlocks.find((b) => b.id === e.time_block_id);
      if (block) mins += block.duration_minutes || 0;
    }
    return mins;
  }, [filteredEntries, view, filterId, timeBlocks]);

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl font-black tracking-tight">Horario semanal</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Generá, filtrá y exportá el horario institucional.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => runGeneration(false)} disabled={generating || dryRunning || !campusId} size="lg">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generando..." : "Generar horario"}
            </Button>
            <Button onClick={() => runGeneration(true)} disabled={generating || dryRunning || !campusId} variant="secondary" size="lg">
              {dryRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {dryRunning ? "Probando..." : "Probar generacion sin guardar"}
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/api/export/excel?${exportQuery}`}>
                <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/planner/print?${exportQuery}`} target="_blank">
                <FileDown className="h-4 w-4" /> Exportar PDF
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {generationStep && (
            <div className="w-full rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
              {generationStep}
            </div>
          )}
          {latestVersionStatus && !["COMPLETED", "PARTIAL"].includes(latestVersionStatus) && (
            <div className="w-full rounded-2xl border border-amber-300 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
              La ultima generacion no se completo. El planner carga la ultima version valida.
            </div>
          )}
          {(generationError || dryRunResult) && (
            <GenerationResultPanel
              result={generationError ?? dryRunResult!}
              dryRun={Boolean(dryRunResult && !generationError)}
              showTechDiag={showTechDiag}
              onToggleTechDiag={() => setShowTechDiag((v) => !v)}
            />
          )}
          <div className="flex w-full items-center gap-1 overflow-x-auto rounded-2xl bg-secondary/70 p-1 sm:w-auto">
            {(["summary", "course", "teacher", "subject", "project"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setView(mode); setFilterId(""); }}
                className={cn(
                  "min-h-10 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  view === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
                )}
              >
                {mode === "summary" ? "Resumen" : mode === "course" ? "Por curso" : mode === "teacher" ? "Por docente" : mode === "subject" ? "Por materia" : "Por proyecto"}
              </button>
            ))}
          </div>
          {view !== "summary" && (
            <select
              className="min-h-11 rounded-xl border bg-card px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {filterOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          )}
          <div className="ml-auto flex items-center gap-2 text-xs">
            {counts.critical > 0 && <Badge className="bg-rose-500/10 text-rose-700">{counts.critical} conflicto{counts.critical === 1 ? "" : "s"}</Badge>}
            {counts.warnings > 0 && <Badge className="bg-amber-500/10 text-amber-700">{counts.warnings} advertencia{counts.warnings === 1 ? "" : "s"}</Badge>}
            {counts.critical === 0 && counts.warnings === 0 && entries.length > 0 && (
              <Badge className="bg-emerald-500/10 text-emerald-700">Sin conflictos</Badge>
            )}
            {view === "teacher" && filterId && totalMinutesShown !== null && (
              <Badge className="bg-secondary">{Math.round(totalMinutesShown / 60 * 10) / 10} h visibles</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {view === "summary" && (
        <>
          {entries.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/60">
              <CardHeader>
                <CardTitle className="text-base">Horario activo</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Última versión lista para filtrar, revisar por curso/docente y exportar.
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-7">
                <Metric label="Bloques asignados" value={activeScheduleStats.assignedBlocks} tone="ok" />
                <Metric label="Clases regulares" value={activeScheduleStats.regularBlocks} tone="ok" />
                <Metric label="Proyectos" value={activeScheduleStats.projectBlocks} tone="info" />
                <Metric label="Institucionales" value={activeScheduleStats.institutionalBlocks} tone="info" />
                <Metric label="Cursos con horario" value={`${activeScheduleStats.coursesWithSchedule}/${courses.length}`} tone="ok" />
                <Metric label="Docentes asignados" value={`${activeScheduleStats.teachersWithSchedule}/${teachers.length}`} tone="ok" />
                <Metric label="Forzados" value={activeScheduleStats.forcedBlocks} tone={activeScheduleStats.forcedBlocks ? "warn" : "ok"} />
              </CardContent>
            </Card>
          )}
          <PreflightCard
            preflight={preflight}
            onRun={runPreflight}
            onSeedBenchmark={seedBenchmark}
            seeding={seeding}
          />
          {(summary || conflicts.length > 0 || forced.length > 0) && (
            <SummaryPanel
              summary={summary}
              conflicts={conflicts}
              forced={forced}
              timeBlocks={timeBlocks}
              teachers={teachers}
              courses={courses}
              subjects={subjects}
              onDeleteForced={deleteForced}
              diagnosticsFilter={diagnosticsFilter}
              onChangeDiagnosticsFilter={setDiagnosticsFilter}
              showTechDiag={showTechDiag}
              onToggleTechDiag={() => setShowTechDiag((v) => !v)}
            />
          )}
        </>
      )}

      {view !== "summary" && (
        <div className="rounded-2xl border bg-card/95 shadow-soft print:border-0">
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[140px_repeat(5,1fr)] bg-muted/70">
                <div className="p-3 text-xs font-semibold text-muted-foreground">Bloque</div>
                {DAYS.map((d) => <div key={d} className="border-l p-3 text-center text-sm font-semibold">{d}</div>)}
              </div>
              {rows.map((row) => {
                if (row.type !== "CLASS") {
                  return (
                    <div key={row.start_time} className={cn("grid grid-cols-[140px_repeat(5,1fr)] border-t text-xs italic", breakStyles[row.type])}>
                      <div className="px-3 py-2 font-medium">{row.label}</div>
                      <div className="col-span-5 border-l px-3 py-2 text-center">
                        {row.type === "LUNCH" ? "Comida y recreo" : row.type === "MINI_BREAK" ? "Mini break" : "Recreo"}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={row.start_time} className="grid grid-cols-[140px_repeat(5,1fr)] border-t">
                    <div className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <div className="font-medium text-foreground">{row.label}</div>
                    </div>
                    {DAYS.map((_, day) => {
                      const block = row.perDay.find((p) => p.day_of_week === day);
                      if (!block) return <div key={day} className="border-l" />;
                      const cellEntries = byCell.get(`${day}|${block.id}`) ?? [];
                      return (
                        <button
                          key={day}
                          type="button"
                          className="min-h-[104px] cursor-pointer border-l p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-secondary/25"
                          onClick={() => setForceCell({ dayLabel: DAYS[day], block, existingEntries: cellEntries })}
                          title="Click para forzar/editar"
                        >
                          {cellEntries.map((e) => <EntryCard key={e.id} entry={e} view={view} />)}
                          {cellEntries.length === 0 && (
                            <span className="text-[10px] font-semibold text-muted-foreground opacity-60 transition">+ forzar</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view !== "summary" && filteredEntries.length === 0 && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">Todavía no hay horario para esta vista.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tocá <strong>Generar horario</strong> y elegí un filtro.
          </p>
        </div>
      )}

      {forceCell && (
        <ForceAssignmentModal
          cell={forceCell}
          courses={courses}
          subjects={subjects}
          teachers={teachers}
          campusId={campusId}
          onClose={() => setForceCell(null)}
          onSaved={async () => {
            setForceCell(null);
            await refreshForced();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EntryCard({ entry, view }: { entry: Entry; view: ViewMode }) {
  if (entry.assignment_type === "INSTITUTIONAL_HOUR") {
    return (
      <div className="mb-1 rounded-xl border border-dashed border-slate-300 bg-slate-100/60 px-2 py-1 text-xs italic text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
        Hora institucional
        {entry.forced ? <span className="ml-1 inline-flex items-center gap-1 text-[9px] not-italic"><Pin className="h-3 w-3" /> Forzado</span> : null}
      </div>
    );
  }
  const isProject = entry.assignment_type !== "REGULAR_CLASS";
  const title = entry.subject_name ?? entry.title ?? "—";
  const color = entry.subject_color ?? "#a78bfa";
  return (
    <div
      className="mb-1.5 rounded-xl border p-2.5 text-left shadow-sm transition hover:-translate-y-0.5"
      style={{ borderColor: color, backgroundColor: `${color}1f` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-sm font-bold">{title}</div>
        {entry.forced ? <Pin className="h-3 w-3 shrink-0 text-rose-600" /> : null}
      </div>
      <div className="truncate text-xs text-muted-foreground">
        {entry.course_name && `${entry.course_name} · `}{view === "course" ? entry.teacher_name : (view === "teacher" ? entry.course_name : `${entry.course_name ?? ""}${entry.teacher_name ? ` · ${entry.teacher_name}` : ""}`)}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-1">
        {isProject && (
          <span className="inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-900">
            {entry.assignment_type.replace("_", " ").toLowerCase()}
          </span>
        )}
        {entry.forced ? (
          <span className="inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-900">
            Forzado
          </span>
        ) : null}
      </div>
    </div>
  );
}

function GenerationResultPanel({
  result,
  dryRun,
  showTechDiag,
  onToggleTechDiag
}: {
  result: GenerationError;
  dryRun: boolean;
  showTechDiag: boolean;
  onToggleTechDiag: () => void;
}) {
  const success = result.status === "SUCCESS";
  const partial = result.status === "PARTIAL";
  return (
    <div className={cn(
      "w-full rounded-2xl border p-3 text-sm",
      success ? "border-emerald-300 bg-emerald-500/10 text-emerald-800" :
        partial ? "border-amber-300 bg-amber-500/10 text-amber-800" :
          "border-rose-300 bg-rose-500/10 text-rose-800"
    )}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          {success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : partial ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          <div>
            <p className="font-semibold">{dryRun ? "Prueba sin guardar" : success ? "Horario generado correctamente." : partial ? "Horario generado parcialmente." : "No se pudo generar el horario."}</p>
            <p className="text-xs opacity-85">{result.message}</p>
            {result.diagnostics && (
              <p className="mt-1 text-xs opacity-75">
                Duracion: {Math.round(result.diagnostics.durationMs / 100) / 10}s · Iteraciones: {result.diagnostics.iterations}
              </p>
            )}
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={onToggleTechDiag}>
          {showTechDiag ? "Ocultar diagnostico tecnico" : "Ver diagnostico tecnico"}
        </Button>
      </div>
      {showTechDiag && result.diagnostics?.technical?.length ? (
        <div className="mt-3 max-h-72 overflow-auto rounded-xl bg-background/70 p-3 font-mono text-[11px] text-foreground">
          {result.diagnostics.technical.slice(0, 40).map((item, index) => (
            <div key={`${item.course}-${item.subject}-${index}`} className="border-b py-2 last:border-b-0">
              <div>{item.course ?? "Sistema"} / {item.subject ?? "General"}</div>
              <div>candidates considered: {item.candidatesConsidered}</div>
              <div>eligible teachers: {item.eligibleTeachers.join(", ") || "-"}</div>
              <div>valid time blocks before conflicts: {item.validTimeBlocksBeforeConflicts}</div>
              {item.freeCourseBlocks?.length ? <div>free course blocks: {item.freeCourseBlocks.join(", ")}</div> : null}
              {item.commonAvailableBlocks?.length ? <div>common available blocks: {item.commonAvailableBlocks.join(", ")}</div> : null}
              {item.blockingAssignments?.length ? <div>blocking assignments: {item.blockingAssignments.join(" | ")}</div> : null}
              <div>rejected: {JSON.stringify(item.rejectedByReason)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PreflightCard({
  preflight,
  onRun,
  onSeedBenchmark,
  seeding
}: {
  preflight: null | { ok: boolean; blockers: string[]; warnings: string[]; counts?: Record<string, number> };
  onRun: () => void;
  onSeedBenchmark: () => void;
  seeding: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">Antes de generar</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Chequeo de datos: cursos, materias, docentes, requisitos por curso, disponibilidad y habilitaciones.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onRun}>Revisar datos</Button>
          <Button size="sm" variant="ghost" onClick={onSeedBenchmark} disabled={seeding}>
            {seeding ? "Cargando..." : "Cargar datos benchmark"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        {!preflight ? (
          <p className="text-muted-foreground">Tocá <strong>Revisar datos</strong> o <strong>Generar horario</strong> para validar antes de generar.</p>
        ) : (
          <>
            {preflight.counts && (
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-8">
                {Object.entries(preflight.counts).map(([k, v]) => (
                  <div key={k} className="rounded-xl border p-2">
                    <div className="text-base font-bold">{v}</div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">{k}</div>
                  </div>
                ))}
              </div>
            )}
            {preflight.blockers.length > 0 && (
              <div className="mb-2 rounded-xl border border-rose-300 bg-rose-500/10 p-3 text-rose-800">
                <div className="mb-1 font-semibold">Faltan datos para generar el horario</div>
                <ul className="ml-4 list-disc space-y-0.5 text-xs">
                  {preflight.blockers.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            )}
            {preflight.warnings.length > 0 && (
              <details className="rounded-xl border border-amber-300 bg-amber-500/10 p-3 text-amber-800">
                <summary className="cursor-pointer font-semibold">{preflight.warnings.length} advertencia(s) previas</summary>
                <ul className="ml-4 mt-2 list-disc space-y-0.5 text-xs">
                  {preflight.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </details>
            )}
            {preflight.ok && preflight.warnings.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Datos listos para generar.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryPanel({
  summary,
  conflicts,
  forced,
  timeBlocks,
  teachers,
  courses,
  subjects,
  onDeleteForced,
  diagnosticsFilter,
  onChangeDiagnosticsFilter,
  showTechDiag,
  onToggleTechDiag
}: {
  summary: null | GenerationSummary;
  conflicts: Conflict[];
  forced: Forced[];
  timeBlocks: TimeBlock[];
  teachers: Array<{ id: string; full_name: string }>;
  courses: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string }>;
  onDeleteForced: (id: string) => void;
  diagnosticsFilter: "all" | "critical" | "warning";
  onChangeDiagnosticsFilter: (f: "all" | "critical" | "warning") => void;
  showTechDiag: boolean;
  onToggleTechDiag: () => void;
}) {
  // Group conflicts by entity_type + entity_id, falling back to "Sistema".
  const grouped = new Map<string, { label: string; rows: Conflict[] }>();
  const visible = conflicts.filter((c) => diagnosticsFilter === "all" || (diagnosticsFilter === "critical" ? c.severity === "CRITICAL" : c.severity === "WARNING"));
  for (const c of visible) {
    const key = c.entity_type && c.entity_id ? `${c.entity_type}|${c.entity_id}` : "system";
    if (!grouped.has(key)) {
      let label = "Sistema";
      if (c.entity_type === "COURSE") label = `Curso · ${courses.find((x) => x.id === c.entity_id)?.name ?? c.entity_id}`;
      else if (c.entity_type === "TEACHER") label = `Docente · ${teachers.find((x) => x.id === c.entity_id)?.full_name ?? c.entity_id}`;
      else if (c.entity_type === "PROJECT") label = "Proyectos / electivas";
      grouped.set(key, { label, rows: [] });
    }
    grouped.get(key)!.rows.push(c);
  }
  const groupedEntries = [...grouped.entries()].sort(([, a], [, b]) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diagnóstico operativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {summary ? (
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-5">
              <Metric label="Cursos completos" value={summary.coursesComplete} tone="ok" />
              <Metric label="Cursos con horas pendientes" value={summary.coursesWithPending} tone={summary.coursesWithPending ? "bad" : "ok"} />
              <Metric label="Bloques pendientes" value={summary.pendingBlocks ?? 0} tone={summary.pendingBlocks ? "bad" : "ok"} />
              <Metric label="Bloques libres" value={summary.freeCourseBlocks ?? 0} tone={summary.freeCourseBlocks ? "warn" : "ok"} />
              <Metric label="Docentes completos" value={summary.teachersComplete} tone="ok" />
              <Metric label="Docentes incompletos" value={summary.teachersIncomplete ?? 0} tone={summary.teachersIncomplete ? "warn" : "ok"} />
              <Metric label="Docentes con hs. institucionales" value={summary.teachersWithInstitutional} tone="info" />
              <Metric label="Horas institucionales" value={summary.institutionalHoursGenerated ?? 0} tone="info" />
              <Metric label="Conflictos críticos" value={summary.critical} tone={summary.critical ? "bad" : "ok"} />
              <Metric label="Advertencias" value={summary.warnings} tone={summary.warnings ? "warn" : "ok"} />
            </div>
          ) : (
            <p className="text-muted-foreground">Generá el horario para ver el diagnóstico.</p>
          )}

          {conflicts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-secondary p-1 text-xs">
              {(["all", "critical", "warning"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => onChangeDiagnosticsFilter(f)}
                  className={cn(
                    "rounded-xl px-3 py-1 font-medium transition",
                    diagnosticsFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? "Ver todo" : f === "critical" ? "Ver críticos" : "Ver advertencias"}
                </button>
              ))}
              <button
                className="ml-auto rounded-xl px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={onToggleTechDiag}
              >
                {showTechDiag ? "Ocultar" : "Ver"} diagnóstico técnico
              </button>
            </div>
          )}

          {conflicts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-3 py-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Sin conflictos detectados.
            </div>
          ) : (
            <div className="space-y-2">
              {groupedEntries.map(([key, group]) => (
                <details key={key} open className="rounded-xl border bg-background">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm font-semibold">
                    <span>{group.label}</span>
                    <span className="text-xs text-muted-foreground">{group.rows.length} ítem(s)</span>
                  </summary>
                  <ul className="space-y-1 border-t p-2">
                    {group.rows.map((c) => (
                      <li
                        key={c.id}
                        className={cn(
                          "flex items-start gap-2 rounded-lg border p-2 text-xs",
                          c.severity === "CRITICAL" ? "border-rose-300 bg-rose-500/10 text-rose-800" : c.severity === "WARNING" ? "border-amber-300 bg-amber-500/10 text-amber-800" : "border-slate-300 bg-slate-100"
                        )}
                      >
                        {c.severity === "INFO" ? <Info className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium">{c.message}</p>
                          {c.suggestion && <p className="mt-0.5 opacity-80">{c.suggestion}</p>}
                          {showTechDiag && <p className="mt-1 font-mono text-[10px] opacity-70">type: {c.type}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Pin className="h-4 w-4" /> Asignaciones forzadas</CardTitle>
          <span className="text-xs text-muted-foreground">{forced.length}</span>
        </CardHeader>
        <CardContent>
          {forced.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tocá una celda del calendario en cualquier vista filtrada para forzar una asignación manual.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {forced.map((f) => {
                const block = timeBlocks.find((b) => b.id === f.time_block_id);
                const course = courses.find((c) => c.id === f.course_id);
                const subject = subjects.find((s) => s.id === f.subject_id);
                const teacher = teachers.find((t) => t.id === f.teacher_id);
                return (
                  <li key={f.id} className="flex items-start justify-between gap-3 rounded-xl border p-2">
                    <div>
                      <div className="font-medium">
                        {subject?.name ?? f.assignment_type.replace("_", " ")} {course && <span className="text-xs text-muted-foreground">· {course.name}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {block ? `${DAYS[block.day_of_week]} · ${block.label}` : f.time_block_id} {teacher && `· ${teacher.full_name}`}
                        {f.hard_override ? <span className="ml-2 inline-flex items-center gap-1 text-rose-600"><LockOpen className="h-3 w-3" /> hard override</span> : null}
                      </div>
                      {f.reason && <p className="mt-1 text-xs italic text-muted-foreground">&ldquo;{f.reason}&rdquo;</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => onDeleteForced(f.id)}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone: "ok" | "warn" | "bad" | "info" }) {
  return (
    <div className={cn(
      "rounded-xl border p-2",
      tone === "ok" && "border-emerald-300 bg-emerald-500/10 text-emerald-800",
      tone === "warn" && "border-amber-300 bg-amber-500/10 text-amber-800",
      tone === "bad" && "border-rose-300 bg-rose-500/10 text-rose-800",
      tone === "info" && "border-slate-300 bg-slate-100"
    )}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

function ForceAssignmentModal({
  cell,
  courses,
  subjects,
  teachers,
  campusId,
  onClose,
  onSaved
}: {
  cell: { dayLabel: string; block: TimeBlock; existingEntries: Entry[] };
  courses: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; full_name: string }>;
  campusId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    course_id: cell.existingEntries[0]?.course_id ?? "",
    subject_id: cell.existingEntries[0]?.subject_id ?? "",
    teacher_id: cell.existingEntries[0]?.teacher_id ?? "",
    assignment_type: (cell.existingEntries[0]?.assignment_type as "REGULAR_CLASS" | "PROJECT" | "ELECTIVE" | "OPTATIVE" | "INSTITUTIONAL_HOUR") ?? "REGULAR_CLASS",
    reason: "",
    hard_override: false
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/forced-assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campusId,
          time_block_id: cell.block.id,
          assignment_type: form.assignment_type,
          course_id: form.course_id || null,
          subject_id: form.subject_id || null,
          teacher_id: form.teacher_id || null,
          reason: form.reason || undefined,
          hard_override: form.hard_override
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message ?? "No se pudo crear la regla forzada.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <FullScreenModal
      title={`Forzar asignación · ${cell.dayLabel} · ${cell.block.label}`}
      subtitle="La regla queda guardada y se aplica en la próxima generación."
      onClose={onClose}
      size="md"
      footer={
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={form.hard_override} onChange={(e) => setForm({ ...form, hard_override: e.target.checked })} />
            Hard override (ignorar disponibilidad y matriz de habilitación)
          </label>
          <Button onClick={submit} disabled={busy}>{busy ? "Guardando..." : "Forzar asignación"}</Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Tipo</span>
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={form.assignment_type} onChange={(e) => setForm({ ...form, assignment_type: e.target.value as never })}>
            <option value="REGULAR_CLASS">Clase regular</option>
            <option value="PROJECT">Proyecto</option>
            <option value="ELECTIVE">Electiva</option>
            <option value="OPTATIVE">Optativa</option>
            <option value="INSTITUTIONAL_HOUR">Hora institucional</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Curso</span>
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
            <option value="">— (sin curso)</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Materia</span>
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">— (sin materia)</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Docente</span>
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
            <option value="">— (sin docente)</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-muted-foreground">Motivo / nota (opcional)</span>
          <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        Sin <strong>hard override</strong>, el motor bloquea si el docente está marcado como No disponible en ese bloque o si la combinación
        docente/materia/curso no está habilitada. Con hard override, se acepta pero queda registrada como advertencia en el resumen.
      </p>
    </FullScreenModal>
  );
}
