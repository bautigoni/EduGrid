"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Edit3, Plus, Trash2, UserRoundCheck, X } from "lucide-react";
import { AvailabilityGrid } from "@/components/scheduler/availability-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assignableBlocks, formatHoursAndMinutes, totalAssignableMinutesPerDay } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Teacher = {
  id: string;
  campusId: string;
  fullName: string;
  email?: string | null;
  subjects: string[];
  contractualHours: number;
  allowInstitutionalHours?: boolean;
  eligibleYears?: number[];
  eligibleCourseIds?: string[];
  preferences?: string | null;
  unavailable: number[][];
};

type SubjectCatalog = { id: string; name: string };
type CourseRef = { id: string; label: string; year: number };

type EditTab = "data" | "subjects" | "eligibility" | "availability";

export function TeachersClient({
  initialTeachers,
  subjectsCatalog,
  coursesCatalog,
  campusId,
  canEdit
}: {
  initialTeachers: Teacher[];
  subjectsCatalog: SubjectCatalog[];
  coursesCatalog: CourseRef[];
  campusId: string;
  canEdit: boolean;
}) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<EditTab>("data");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ fullName: "", email: "", contractualHours: 20, preferences: "", subjects: "" });
  const selected = teachers.find((teacher) => teacher.id === editingId) ?? null;

  function createTeacher() {
    if (!draft.fullName.trim()) return;
    const teacher: Teacher = {
      id: `local-teacher-${Date.now()}`,
      campusId,
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      contractualHours: draft.contractualHours,
      allowInstitutionalHours: true,
      eligibleYears: [],
      eligibleCourseIds: [],
      preferences: draft.preferences.trim(),
      subjects: draft.subjects.split(",").map((item) => item.trim()).filter(Boolean),
      unavailable: []
    };
    setTeachers((current) => [teacher, ...current]);
    setEditingId(teacher.id);
    setTab("data");
    setCreating(false);
    setDraft({ fullName: "", email: "", contractualHours: 20, preferences: "", subjects: "" });
  }

  function patchTeacher(id: string, patch: Partial<Teacher>) {
    setTeachers((current) => current.map((teacher) => (teacher.id === id ? { ...teacher, ...patch } : teacher)));
  }

  function deleteTeacher(id: string) {
    setTeachers((current) => current.filter((teacher) => teacher.id !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Plantel docente</CardTitle>
            <p className="text-sm text-muted-foreground">Cargá nombres, materias compatibles, años/cursos habilitados, carga horaria y disponibilidad.</p>
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Nuevo docente
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {creating && (
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Crear docente</h3>
                <Button variant="ghost" size="icon" onClick={() => setCreating(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Nombre completo" value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} />
                <Input placeholder="Email (opcional)" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
                <Input type="number" placeholder="Carga horaria contractual (hs)" value={draft.contractualHours} onChange={(event) => setDraft({ ...draft, contractualHours: Number(event.target.value) })} />
                <Input placeholder="Materias (separadas por coma)" value={draft.subjects} onChange={(event) => setDraft({ ...draft, subjects: event.target.value })} />
              </div>
              <Input className="mt-3" placeholder="Preferencias / notas" value={draft.preferences} onChange={(event) => setDraft({ ...draft, preferences: event.target.value })} />
              <Button className="mt-3" onClick={createTeacher}>Guardar docente</Button>
            </div>
          )}

          {teachers.length === 0 && !creating && (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-semibold">No hay docentes cargados.</p>
              <p className="mt-1 text-sm text-muted-foreground">Empezá tu plantel agregando el primer docente.</p>
              {canEdit && (
                <Button className="mt-4" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" />
                  Crear primer docente
                </Button>
              )}
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="rounded-2xl border p-4 transition hover:bg-secondary/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-semibold">
                      <UserRoundCheck className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{teacher.fullName}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{teacher.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Carga: {teacher.contractualHours} hs</Badge>
                    {canEdit && (
                      <Button size="sm" variant="secondary" onClick={() => { setEditingId(teacher.id); setTab("data"); }}>
                        <Edit3 className="h-4 w-4" />
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {teacher.subjects.map((subject) => (
                    <Badge key={`${teacher.id}-${subject}`} className="bg-primary/10 text-primary">
                      {subject}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{teacher.preferences}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <TeacherEditDrawer
          teacher={selected}
          subjectsCatalog={subjectsCatalog}
          coursesCatalog={coursesCatalog}
          tab={tab}
          setTab={setTab}
          onClose={() => setEditingId(null)}
          onDelete={() => deleteTeacher(selected.id)}
          onPatch={(patch) => patchTeacher(selected.id, patch)}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

function TeacherEditDrawer({
  teacher,
  subjectsCatalog,
  coursesCatalog,
  tab,
  setTab,
  onClose,
  onDelete,
  onPatch,
  canEdit
}: {
  teacher: Teacher;
  subjectsCatalog: SubjectCatalog[];
  coursesCatalog: CourseRef[];
  tab: EditTab;
  setTab: (tab: EditTab) => void;
  onClose: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<Teacher>) => void;
  canEdit: boolean;
}) {
  const stats = useMemo(() => {
    const unavailableSet = new Set(teacher.unavailable.map(([d, b]) => `${d}-${b}`));
    let availableMinutes = 0;
    for (let day = 0; day < 5; day += 1) {
      for (const block of assignableBlocks) {
        if (!unavailableSet.has(`${day}-${block.blockIndex}`)) {
          availableMinutes += block.durationMinutes;
        }
      }
    }
    const contractualMinutes = teacher.contractualHours * 60;
    const diff = contractualMinutes - availableMinutes;
    const totalWeekMinutes = totalAssignableMinutesPerDay * 5;
    return { availableMinutes, contractualMinutes, diff, totalWeekMinutes };
  }, [teacher.unavailable, teacher.contractualHours]);

  const exceeded = stats.diff < 0;
  const exact = stats.diff === 0;
  const allYears = Array.from(new Set(coursesCatalog.map((c) => c.year))).sort((a, b) => a - b);

  function toggleSubject(name: string) {
    const has = teacher.subjects.includes(name);
    onPatch({ subjects: has ? teacher.subjects.filter((s) => s !== name) : [...teacher.subjects, name] });
  }

  function toggleYear(year: number) {
    const current = teacher.eligibleYears ?? [];
    const has = current.includes(year);
    onPatch({ eligibleYears: has ? current.filter((y) => y !== year) : [...current, year] });
  }

  function toggleCourse(id: string) {
    const current = teacher.eligibleCourseIds ?? [];
    const has = current.includes(id);
    onPatch({ eligibleCourseIds: has ? current.filter((c) => c !== id) : [...current, id] });
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button aria-label="Cerrar" className="flex-1 bg-slate-950/50" onClick={onClose} />
      <aside className="flex h-full w-full max-w-3xl flex-col border-l bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-bold">{teacher.fullName}</h2>
            <p className="text-sm text-muted-foreground">{teacher.email ?? "Sin email"}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b px-5 py-2">
          {(["data", "subjects", "eligibility", "availability"] as EditTab[]).map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                tab === value ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {value === "data" && "Datos"}
              {value === "subjects" && "Materias"}
              {value === "eligibility" && "Años y cursos"}
              {value === "availability" && "Disponibilidad"}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "data" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Nombre completo</span>
                <Input value={teacher.fullName} onChange={(e) => onPatch({ fullName: e.target.value })} disabled={!canEdit} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Email</span>
                <Input value={teacher.email ?? ""} onChange={(e) => onPatch({ email: e.target.value })} disabled={!canEdit} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Carga horaria contractual (hs)</span>
                <Input type="number" min={1} max={48} value={teacher.contractualHours} onChange={(e) => onPatch({ contractualHours: Number(e.target.value) })} disabled={!canEdit} />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Preferencias / notas</span>
                <Input value={teacher.preferences ?? ""} onChange={(e) => onPatch({ preferences: e.target.value })} disabled={!canEdit} />
              </label>
            </div>
          )}

          {tab === "subjects" && (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">Materias que puede dictar.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {subjectsCatalog.map((subject) => {
                  const checked = teacher.subjects.includes(subject.name);
                  return (
                    <label key={subject.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition", checked && "bg-primary/10 text-primary")}>
                      <input type="checkbox" checked={checked} onChange={() => toggleSubject(subject.name)} disabled={!canEdit} />
                      {subject.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "eligibility" && (
            <div className="space-y-6">
              <div>
                <p className="mb-1 text-sm font-semibold">Puede dar clases en estos años</p>
                <p className="mb-3 text-xs text-muted-foreground">Si no marcás ningún año ni curso, se considera apto para todos.</p>
                <div className="flex flex-wrap gap-2">
                  {allYears.map((year) => {
                    const checked = teacher.eligibleYears?.includes(year);
                    return (
                      <label key={year} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition", checked && "bg-primary/10 text-primary")}>
                        <input type="checkbox" checked={!!checked} onChange={() => toggleYear(year)} disabled={!canEdit} />
                        Año {year}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold">Cursos específicos (opcional)</p>
                <p className="mb-3 text-xs text-muted-foreground">Restringí aún más con cursos específicos. Si está vacío, se usan los años marcados arriba.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {coursesCatalog.map((course) => {
                    const checked = teacher.eligibleCourseIds?.includes(course.id);
                    return (
                      <label key={course.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition", checked && "bg-primary/10 text-primary")}>
                        <input type="checkbox" checked={!!checked} onChange={() => toggleCourse(course.id)} disabled={!canEdit} />
                        {course.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "availability" && (
            <div className="space-y-4">
              <ContractualLoadStatus stats={stats} exceeded={exceeded} exact={exact} />
              <AvailabilityGrid
                unavailable={(teacher.unavailable ?? []) as [number, number][]}
                readOnly={!canEdit}
                entity="teacher"
                onChange={(next) => onPatch({ unavailable: next })}
              />
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t p-4">
          {canEdit ? (
            <Button variant="ghost" className="text-rose-600" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Eliminar docente
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {exceeded && tab === "availability" && (
              <span className="text-xs text-rose-600">No se puede guardar: disponibilidad supera la carga contractual.</span>
            )}
            <Button onClick={onClose} disabled={exceeded}>
              Guardar y cerrar
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function ContractualLoadStatus({
  stats,
  exceeded,
  exact
}: {
  stats: { availableMinutes: number; contractualMinutes: number; diff: number };
  exceeded: boolean;
  exact: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 text-sm",
        exceeded
          ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          : exact
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-secondary/40"
      )}
    >
      <div className="flex items-center gap-2 font-semibold">
        {exceeded ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        Carga y disponibilidad
      </div>
      <dl className="mt-2 grid gap-1 text-xs">
        <div className="flex justify-between">
          <dt>Carga contractual</dt>
          <dd className="font-semibold">{formatHoursAndMinutes(stats.contractualMinutes)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Disponibilidad marcada</dt>
          <dd className="font-semibold">{formatHoursAndMinutes(stats.availableMinutes)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{exceeded ? "Exceso" : "Disponible restante"}</dt>
          <dd className="font-semibold">
            {exceeded ? `+${formatHoursAndMinutes(Math.abs(stats.diff))}` : formatHoursAndMinutes(stats.diff)}
          </dd>
        </div>
      </dl>
      {exceeded && (
        <p className="mt-2 text-xs">
          Marcaste {formatHoursAndMinutes(stats.availableMinutes)} disponibles, pero la carga contractual es de {formatHoursAndMinutes(stats.contractualMinutes)}. Reducí la disponibilidad o aumentá la carga contractual.
        </p>
      )}
      {!exceeded && !exact && (
        <p className="mt-2 text-xs text-muted-foreground">
          Todavía podés marcar {formatHoursAndMinutes(stats.diff)} disponibles antes de cubrir la carga contractual.
        </p>
      )}
    </div>
  );
}
