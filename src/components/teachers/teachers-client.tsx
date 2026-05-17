"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Edit3, Plus, Search, Trash2, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FullScreenModal } from "@/components/ui/full-screen-modal";
import { cn } from "@/lib/utils";

type Teacher = {
  id: string;
  campus_id: string;
  full_name: string;
  email: string | null;
  contractual_weekly_minutes: number;
  allow_institutional_hours: number;
  notes: string | null;
};

type Subject = { id: string; name: string; color: string | null };
type Course = { id: string; name: string; year: number | null };
type TimeBlock = { id: string; day_of_week: number; block_index: number; start_time: string; end_time: string; duration_minutes: number; label: string; type: string; is_assignable: number };

type Tab = "data" | "matrix" | "availability";
type EligibilityCell = { subject_id: string; course_id: string };
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];


export function TeachersClient({
  initialTeachers,
  subjects,
  courses,
  timeBlocks,
  campusId,
  canEdit
}: {
  initialTeachers: Teacher[];
  subjects: Subject[];
  courses: Course[];
  timeBlocks: TimeBlock[];
  campusId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!campusId) {
    return (
      <div className="p-8">
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Seleccioná una sede.</CardContent></Card>
      </div>
    );
  }

  async function create(form: { full_name: string; email: string; contractual_hours: number; notes: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campusId,
          full_name: form.full_name,
          email: form.email || undefined,
          contractual_weekly_minutes: Math.max(0, Math.round((form.contractual_hours || 0) * 60)),
          notes: form.notes || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "No se pudo crear."); return; }
      setTeachers((cur) => [data, ...cur]);
      setCreating(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar docente? (se archiva)")) return;
    const res = await fetch(`/api/teachers/${id}?campusId=${campusId}`, { method: "DELETE" });
    if (res.ok) {
      setTeachers((cur) => cur.filter((t) => t.id !== id));
      if (editing?.id === id) setEditing(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Plantel docente</CardTitle>
            <p className="text-sm text-muted-foreground">Cargá nombres, materias compatibles, años/cursos habilitados y disponibilidad.</p>
          </div>
          {canEdit && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Nuevo docente
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-semibold">No hay docentes cargados.</p>
              <p className="mt-1 text-sm text-muted-foreground">Empezá tu plantel agregando el primer docente.</p>
              {canEdit && (
                <Button className="mt-4" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" /> Crear primer docente
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold">
                        <UserRoundCheck className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{teacher.full_name}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                    <Badge>{Math.round((teacher.contractual_weekly_minutes || 0) / 60)} hs semanales</Badge>
                  </div>
                  {teacher.notes && <p className="mt-2 text-xs text-muted-foreground">{teacher.notes}</p>}
                  {canEdit && (
                    <div className="mt-3 flex justify-end gap-1">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(teacher)}>
                        <Edit3 className="h-4 w-4" /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(teacher.id)}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {creating && (
        <NewTeacherModal busy={busy} error={error} onClose={() => setCreating(false)} onSubmit={create} />
      )}
      {editing && (
        <TeacherEditModal
          teacher={editing}
          subjects={subjects}
          courses={courses}
          timeBlocks={timeBlocks}
          campusId={campusId}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setTeachers((cur) => cur.map((t) => (t.id === updated.id ? updated : t)));
            router.refresh();
          }}
          onDelete={() => remove(editing.id)}
        />
      )}
    </div>
  );
}

function NewTeacherModal({
  busy,
  error,
  onClose,
  onSubmit
}: {
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (form: { full_name: string; email: string; contractual_hours: number; notes: string }) => void;
}) {
  const [form, setForm] = useState({ full_name: "", email: "", contractual_hours: 20, notes: "" });
  return (
    <FullScreenModal title="Nuevo docente" onClose={onClose} size="md">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Nombre completo</span>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Email (opcional)</span>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Carga horaria contractual (hs)</span>
          <Input type="number" min={0} max={60} value={form.contractual_hours} onChange={(e) => setForm({ ...form, contractual_hours: Number(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-muted-foreground">Notas (opcional)</span>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSubmit(form)} disabled={busy || !form.full_name.trim()}>
          {busy ? "Creando..." : "Crear docente"}
        </Button>
      </div>
    </FullScreenModal>
  );
}

function TeacherEditModal({
  teacher,
  subjects,
  courses,
  timeBlocks,
  campusId,
  onClose,
  onSaved,
  onDelete
}: {
  teacher: Teacher;
  subjects: Subject[];
  courses: Course[];
  timeBlocks: TimeBlock[];
  campusId: string;
  onClose: () => void;
  onSaved: (t: Teacher) => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<Tab>("data");
  const [data, setData] = useState({
    full_name: teacher.full_name,
    email: teacher.email ?? "",
    contractual_weekly_minutes: teacher.contractual_weekly_minutes,
    notes: teacher.notes ?? ""
  });
  const [matrixCells, setMatrixCells] = useState<EligibilityCell[]>([]);
  const [availableBlockIds, setAvailableBlockIds] = useState<string[]>([]);
  const [matrixQuery, setMatrixQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/teachers/${teacher.id}/eligibility-matrix`).then((r) => r.json()).then((rows: EligibilityCell[]) => setMatrixCells(rows ?? [])).catch(() => null);
    fetch(`/api/teachers/${teacher.id}/availability`).then((r) => r.json()).then((rows: Array<{ time_block_id: string; status: string }>) => {
      setAvailableBlockIds(rows.filter((r) => r.status === "AVAILABLE").map((r) => r.time_block_id));
    }).catch(() => null);
  }, [teacher.id]);

  const stats = useMemo(() => {
    // Pedagogical hours: every assignable CLASS block counts as 1 hr regardless
    // of real clock minutes. Contractual cap is stored as hours*60 minutes, so
    // divide by 60 to compare with block counts.
    const idSet = new Set(availableBlockIds);
    const availBlocks = timeBlocks.filter((b) => idSet.has(b.id)).length;
    const contractualBlocks = Math.round((data.contractual_weekly_minutes || 0) / 60);
    const diff = contractualBlocks - availBlocks;
    return { availBlocks, contractualBlocks, diff };
  }, [availableBlockIds, timeBlocks, data.contractual_weekly_minutes]);
  // Availability is now the "possible assignment window", so showing more
  // hours than the contractual load is fine. We only flag the inverse case
  // (availability lower than contractual) so the user can act if they want.
  const availabilityBelowContract = stats.diff > 0;

  function toggleCell(subjectId: string, courseId: string) {
    setMatrixCells((cur) => {
      const has = cur.some((c) => c.subject_id === subjectId && c.course_id === courseId);
      return has ? cur.filter((c) => !(c.subject_id === subjectId && c.course_id === courseId)) : [...cur, { subject_id: subjectId, course_id: courseId }];
    });
  }
  const coursesByYear = useMemo(() => {
    const groups = new Map<number, Course[]>();
    for (const course of courses) {
      const year = course.year ?? (Number.parseInt(course.name, 10) || 0);
      groups.set(year, [...(groups.get(year) ?? []), course]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, items]) => ({ year, courses: items.sort((a, b) => a.name.localeCompare(b.name, "es")) }));
  }, [courses]);

  const filteredSubjects = useMemo(() => {
    const query = matrixQuery.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) => subject.name.toLowerCase().includes(query));
  }, [subjects, matrixQuery]);

  function setSubjectCourses(subjectId: string, courseIds: string[], enabled: boolean) {
    setMatrixCells((current) => {
      const target = new Set(courseIds);
      const withoutTargets = current.filter((cell) => !(cell.subject_id === subjectId && target.has(cell.course_id)));
      if (!enabled) return withoutTargets;
      return [...withoutTargets, ...courseIds.map((courseId) => ({ subject_id: subjectId, course_id: courseId }))];
    });
  }

  function subjectCount(subjectId: string) {
    return matrixCells.filter((cell) => cell.subject_id === subjectId).length;
  }
  function toggleBlock(id: string) {
    setAvailableBlockIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const patchRes = await fetch(`/api/teachers/${teacher.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, ...data })
      });
      if (!patchRes.ok) {
        const d = await patchRes.json();
        setErr(d.message ?? "No se pudo guardar.");
        return;
      }
      const updated = (await patchRes.json()) as Teacher;

      await fetch(`/api/teachers/${teacher.id}/eligibility-matrix`, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, cells: matrixCells })
      });
      const entries = timeBlocks.map((b) => ({
        time_block_id: b.id,
        status: availableBlockIds.includes(b.id) ? "AVAILABLE" : "UNAVAILABLE"
      }));
      await fetch(`/api/teachers/${teacher.id}/availability`, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, entries })
      });
      onSaved(updated);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  // group blocks by row
  const rowMap = new Map<string, { type: string; label: string; start_time: string; perDay: TimeBlock[] }>();
  for (const b of timeBlocks) {
    const key = `${b.start_time}|${b.type}`;
    if (!rowMap.has(key)) rowMap.set(key, { type: b.type, label: b.label, start_time: b.start_time, perDay: [] });
    rowMap.get(key)!.perDay.push(b);
  }
  const rows = [...rowMap.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <FullScreenModal
      title={`Editar docente · ${teacher.full_name}`}
      onClose={onClose}
      tabs={
        <>
          {(["data", "matrix", "availability"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                tab === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {t === "data" && "Datos"}
              {t === "matrix" && "Materias y cursos habilitados"}
              {t === "availability" && "Disponibilidad"}
            </button>
          ))}
        </>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" className="text-rose-600" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Eliminar docente
          </Button>
          <div className="flex items-center gap-2">
            {availabilityBelowContract && (
              <span className="text-xs text-amber-700">Disponibilidad menor que la carga contractual.</span>
            )}
            {err && <span className="text-xs text-rose-600">{err}</span>}
            <Button onClick={save} disabled={busy}>{busy ? "Guardando..." : "Guardar cambios"}</Button>
          </div>
        </div>
      }
    >
      {tab === "data" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Nombre completo</span>
            <Input value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Email</span>
            <Input value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Carga horaria contractual semanal (hs)</span>
            <Input
              type="number"
              min={0}
              value={Math.round(data.contractual_weekly_minutes / 60)}
              onChange={(e) => setData({ ...data, contractual_weekly_minutes: Math.max(0, Number(e.target.value) * 60) })}
            />
            <span className="text-[11px] text-muted-foreground">Cada bloque de clase = 1 hora pedagógica. Internamente se guardan {data.contractual_weekly_minutes} minutos.</span>
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Notas</span>
            <Input value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} />
          </label>
        </div>
      )}

      {tab === "matrix" && (
        <div className="space-y-3">
          <div className="grid gap-3 rounded-2xl border bg-secondary/35 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <p className="font-semibold">Matriz de habilitaciones</p>
              <p className="mt-1 text-sm text-muted-foreground">Agrupá cursos por año, usá celdas grandes y marcá habilitaciones sin pelearte con una planilla.</p>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={matrixQuery} onChange={(event) => setMatrixQuery(event.target.value)} placeholder="Buscar materia..." />
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Marcá los cursos exactos donde el docente puede dictar cada materia. Un docente puede enseñar Matemática en 1N pero no en 6N.
          </p>
          {subjects.length === 0 || courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Necesitás al menos una materia y un curso para configurar la matriz.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-card">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="sticky left-0 z-10 min-w-[240px] bg-muted px-3 py-3 text-left text-xs font-bold text-muted-foreground">Materia / Curso</th>
                    {courses.map((c) => (
                      <th key={c.id} className="border-l px-2 py-2 text-center text-xs font-semibold">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((s) => {
                    const rowCount = subjectCount(s.id);
                    const allEnabled = rowCount === courses.length;
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="sticky left-0 z-10 border-t bg-card px-3 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color ?? "#ccc" }} />
                            <span className="font-medium">{s.name}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{rowCount} curso{rowCount === 1 ? "" : "s"} habilitado{rowCount === 1 ? "" : "s"}</div>
                          <button
                            type="button"
                            className="mt-1 text-[11px] text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setSubjectCourses(s.id, courses.map((course) => course.id), !allEnabled);
                            }}
                          >
                            {allEnabled ? "Quitar todos" : "Marcar todos"}
                          </button>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {coursesByYear.map((group) => (
                              <button
                                key={`${s.id}-${group.year}`}
                                type="button"
                                className="rounded-lg border bg-background px-2 py-1 text-[11px] font-semibold transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={() => {
                                  const ids = group.courses.map((course) => course.id);
                                  const enabled = ids.some((id) => !matrixCells.some((cell) => cell.subject_id === s.id && cell.course_id === id));
                                  setSubjectCourses(s.id, ids, enabled);
                                }}
                              >
                                {group.year ? `${group.year}°` : "S/A"}
                              </button>
                            ))}
                          </div>
                        </td>
                        {courses.map((c) => {
                          const checked = matrixCells.some((cell) => cell.subject_id === s.id && cell.course_id === c.id);
                          return (
                            <td key={c.id} className="border-l border-t p-1 text-center">
                              <button
                                type="button"
                                aria-pressed={checked}
                                aria-label={`${checked ? "Quitar" : "Habilitar"} ${s.name} en ${c.name}`}
                                onClick={() => toggleCell(s.id, c.id)}
                                className={cn(
                                  "min-h-11 w-full rounded-xl border text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  checked
                                    ? "border-emerald-300 bg-emerald-100 text-emerald-900 shadow-sm"
                                    : "border-transparent bg-muted/35 text-muted-foreground hover:border-emerald-200 hover:bg-secondary/50"
                                )}
                              >
                                {checked ? "Sí" : "No"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Si la matriz queda vacía, el scheduler considera al docente <em>no habilitado</em> para nada (no se usa la matriz heredada como atajo).
          </p>
        </div>
      )}

      {tab === "availability" && (
        <div className="space-y-4">
          <div
            className={cn(
              "rounded-2xl border p-3 text-sm",
              availabilityBelowContract ? "border-amber-400/50 bg-amber-500/10 text-amber-800" : "bg-secondary/40"
            )}
          >
            <div className="flex items-center gap-2 font-semibold">
              {availabilityBelowContract ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              Carga y disponibilidad
            </div>
            <dl className="mt-2 grid gap-1 text-xs">
              <div className="flex justify-between"><dt>Carga contractual</dt><dd className="font-semibold">{stats.contractualBlocks} hs semanales</dd></div>
              <div className="flex justify-between"><dt>Disponibilidad marcada</dt><dd className="font-semibold">{stats.availBlocks} bloques disponibles</dd></div>
            </dl>
            <p className="mt-1 text-[11px] text-muted-foreground">Cada bloque de clase cuenta como 1 hora pedagógica, independientemente de los minutos reales.</p>
            <p className="mt-2 text-xs">
              La disponibilidad define cuándo <strong>puede</strong> ser asignado. El motor elige las horas necesarias hasta cubrir la carga contractual.
              {availabilityBelowContract && (
                <> La disponibilidad cargada es menor que la carga contractual: ampliá la disponibilidad o reducí la carga.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border bg-emerald-100 px-3 font-semibold text-emerald-900"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponible</span>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border bg-card px-3 font-semibold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-slate-300" /> No disponible</span>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border bg-orange-100 px-3 font-semibold text-orange-900"><span className="h-2 w-2 rounded-full bg-orange-400" /> Ocupado</span>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border bg-rose-100 px-3 font-semibold text-rose-900"><span className="h-2 w-2 rounded-full bg-rose-500" /> Conflicto</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[140px_repeat(5,1fr)] bg-muted/60 text-xs font-semibold text-muted-foreground">
                <div className="p-2">Bloque</div>
                {DAYS.map((d) => <div key={d} className="border-l p-2 text-center">{d}</div>)}
              </div>
              {rows.map((row) => {
                const isBreak = row.type !== "CLASS";
                if (isBreak) {
                  return (
                    <div key={row.start_time} className="grid grid-cols-[140px_repeat(5,1fr)] border-t bg-amber-500/10 text-amber-700 text-xs italic">
                      <div className="px-2 py-1.5 font-medium">{row.label}</div>
                      <div className="col-span-5 border-l px-2 py-1.5 text-center">
                        {row.type === "LUNCH" ? "Comida y recreo" : row.type === "MINI_BREAK" ? "Mini break" : "Recreo"}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={row.start_time} className="grid grid-cols-[140px_repeat(5,1fr)] border-t">
                    <div className="bg-muted/30 px-2 py-2 text-xs text-muted-foreground">
                      <div className="font-medium text-foreground">{row.label}</div>
                    </div>
                    {DAYS.map((_, day) => {
                      const block = row.perDay.find((p) => p.day_of_week === day);
                      if (!block) return <div key={day} className="border-l" />;
                      const checked = availableBlockIds.includes(block.id);
                      return (
                        <button
                          key={day}
                          type="button"
                          className={cn(
                            "min-h-14 border-l text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            checked ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200/70" : "bg-card text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => toggleBlock(block.id)}
                          aria-label={`${DAYS[day]} ${row.label}: ${checked ? "disponible" : "no disponible"}`}
                        >
                          {checked ? "Disponible" : "No"}
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
    </FullScreenModal>
  );
}
