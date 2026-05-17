"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FullScreenModal } from "@/components/ui/full-screen-modal";
import { cn } from "@/lib/utils";

type Course = {
  id: string;
  campus_id: string;
  name: string;
  year: number | null;
  division: string | null;
  default_classroom_label: string | null;
  student_count: number | null;
};
type Subject = { id: string; name: string; color: string | null };
type TimeBlock = { id: string; day_of_week: number; block_index: number; start_time: string; type: string; label: string };

type Tab = "data" | "subjects" | "availability";
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

export function CoursesClient({
  initialCourses,
  subjects,
  timeBlocks,
  campusId,
  canEdit
}: {
  initialCourses: Course[];
  subjects: Subject[];
  timeBlocks: TimeBlock[];
  campusId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!campusId) {
    return <div className="p-8"><Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Seleccioná una sede.</CardContent></Card></div>;
  }

  async function create(form: { name: string; year: number; division: string; default_classroom_label: string; student_count: number }) {
    setBusy(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, ...form, default_classroom_label: form.default_classroom_label || undefined })
      });
      if (res.ok) {
        const created = (await res.json()) as Course;
        setCourses((cur) => [created, ...cur]);
        setCreating(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar curso? (se archiva)")) return;
    const res = await fetch(`/api/courses/${id}?campusId=${campusId}`, { method: "DELETE" });
    if (res.ok) {
      setCourses((cur) => cur.filter((c) => c.id !== id));
      if (editing?.id === id) setEditing(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cursos</CardTitle>
          {canEdit && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Nuevo curso
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-semibold">No hay cursos cargados.</p>
              <p className="mt-1 text-sm text-muted-foreground">Empezá creando el primer curso de tu sede.</p>
              {canEdit && (
                <Button className="mt-4" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" /> Crear primer curso
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {courses.map((course) => (
                <div key={course.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{course.name}</h3>
                      <p className="text-xs text-muted-foreground">{course.year ? `Año ${course.year}` : ""} {course.division ? `· División ${course.division}` : ""}</p>
                      <p className="text-xs text-muted-foreground">Aula: {course.default_classroom_label ?? `Aula ${course.name}`}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(course)}>
                          <Edit3 className="h-4 w-4" /> Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(course.id)}>
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.student_count != null && <Badge>{course.student_count} estudiantes</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {creating && <NewCourseModal busy={busy} onClose={() => setCreating(false)} onSubmit={create} />}
      {editing && (
        <CourseEditModal
          course={editing}
          subjects={subjects}
          timeBlocks={timeBlocks}
          campusId={campusId}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setCourses((cur) => cur.map((c) => (c.id === updated.id ? updated : c)));
            router.refresh();
          }}
          onDelete={() => remove(editing.id)}
        />
      )}
    </div>
  );
}

function NewCourseModal({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (f: { name: string; year: number; division: string; default_classroom_label: string; student_count: number }) => void }) {
  const [form, setForm] = useState({ name: "", year: 1, division: "A", default_classroom_label: "", student_count: 28 });
  return (
    <FullScreenModal title="Nuevo curso" onClose={onClose} size="md">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Nombre del curso</span>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. 1A" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Año</span>
          <Input type="number" min={1} max={12} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">División</span>
          <Input value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Cantidad de estudiantes</span>
          <Input type="number" min={0} value={form.student_count} onChange={(e) => setForm({ ...form, student_count: Number(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-muted-foreground">Aula base (opcional)</span>
          <Input value={form.default_classroom_label} onChange={(e) => setForm({ ...form, default_classroom_label: e.target.value })} placeholder={`Aula ${form.name || "..."}`} />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSubmit(form)} disabled={busy || !form.name.trim()}>{busy ? "Creando..." : "Crear curso"}</Button>
      </div>
    </FullScreenModal>
  );
}

function CourseEditModal({
  course,
  subjects,
  timeBlocks,
  campusId,
  onClose,
  onSaved,
  onDelete
}: {
  course: Course;
  subjects: Subject[];
  timeBlocks: TimeBlock[];
  campusId: string;
  onClose: () => void;
  onSaved: (c: Course) => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<Tab>("data");
  const [data, setData] = useState({
    name: course.name,
    year: course.year ?? 1,
    division: course.division ?? "",
    default_classroom_label: course.default_classroom_label ?? "",
    student_count: course.student_count ?? 0
  });
  const [requirements, setRequirements] = useState<Array<{ subject_id: string; weekly_blocks_required: number }>>([]);
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [newRow, setNewRow] = useState({ subject_id: "", hours: 3 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${course.id}/subjects`)
      .then((r) => r.json())
      .then((rows: Array<{ subject_id: string; weekly_blocks_required: number }>) => setRequirements(rows.map((r) => ({ subject_id: r.subject_id, weekly_blocks_required: r.weekly_blocks_required }))))
      .catch(() => null);
    fetch(`/api/courses/${course.id}/availability`)
      .then((r) => r.json())
      .then((rows: Array<{ time_block_id: string; status: string }>) => setAvailability(new Set(rows.filter((r) => r.status === "AVAILABLE").map((r) => r.time_block_id))))
      .catch(() => null);
  }, [course.id]);

  const usedIds = new Set(requirements.map((r) => r.subject_id));
  const available = subjects.filter((s) => !usedIds.has(s.id));

  // Pre-select first available subject when list changes
  useEffect(() => {
    if (!newRow.subject_id || !available.find((s) => s.id === newRow.subject_id)) {
      setNewRow((prev) => ({ ...prev, subject_id: available[0]?.id ?? "" }));
    }
  }, [available, newRow.subject_id]);

  function addRequirement() {
    if (!newRow.subject_id) return;
    if (requirements.some((r) => r.subject_id === newRow.subject_id)) return;
    setRequirements((cur) => [...cur, { subject_id: newRow.subject_id, weekly_blocks_required: Math.max(1, newRow.hours) }]);
    setNewRow({ subject_id: "", hours: 3 });
  }
  function updateHours(subject_id: string, hours: number) {
    setRequirements((cur) => cur.map((r) => (r.subject_id === subject_id ? { ...r, weekly_blocks_required: Math.max(0, hours) } : r)));
  }
  function removeRequirement(subject_id: string) {
    setRequirements((cur) => cur.filter((r) => r.subject_id !== subject_id));
  }
  function toggleBlock(id: string) {
    setAvailability((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    try {
      const patchRes = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, ...data })
      });
      const updated = patchRes.ok ? ((await patchRes.json()) as Course) : course;

      await fetch(`/api/courses/${course.id}/subjects`, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, requirements })
      });
      const entries = timeBlocks.map((b) => ({
        time_block_id: b.id,
        status: availability.has(b.id) ? "AVAILABLE" : "UNAVAILABLE"
      }));
      await fetch(`/api/courses/${course.id}/availability`, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, entries })
      });
      onSaved(updated);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  // Group time blocks by row
  const rowMap = new Map<string, { type: string; label: string; start_time: string; perDay: TimeBlock[] }>();
  for (const b of timeBlocks) {
    const key = `${b.start_time}|${b.type}`;
    if (!rowMap.has(key)) rowMap.set(key, { type: b.type, label: b.label, start_time: b.start_time, perDay: [] });
    rowMap.get(key)!.perDay.push(b);
  }
  const rows = [...rowMap.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <FullScreenModal
      title={`Editar curso · ${course.name}`}
      onClose={onClose}
      tabs={
        <>
          {(["data", "subjects", "availability"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                tab === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {t === "data" && "Datos"}
              {t === "subjects" && "Materias y horas"}
              {t === "availability" && "Disponibilidad"}
            </button>
          ))}
        </>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" className="text-rose-600" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Eliminar curso
          </Button>
          <Button onClick={save} disabled={busy}>{busy ? "Guardando..." : "Guardar cambios"}</Button>
        </div>
      }
    >
      {tab === "data" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Nombre del curso</span>
            <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Año</span>
            <Input type="number" min={1} value={data.year} onChange={(e) => setData({ ...data, year: Number(e.target.value) })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">División</span>
            <Input value={data.division} onChange={(e) => setData({ ...data, division: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Cantidad de estudiantes</span>
            <Input type="number" min={0} value={data.student_count} onChange={(e) => setData({ ...data, student_count: Number(e.target.value) })} />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Aula base</span>
            <Input value={data.default_classroom_label} onChange={(e) => setData({ ...data, default_classroom_label: e.target.value })} />
          </label>
        </div>
      )}

      {tab === "subjects" && (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-2xl border bg-secondary/40 p-4 sm:grid-cols-[2fr_1fr_auto]">
            <select
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              value={newRow.subject_id}
              onChange={(e) => setNewRow({ ...newRow, subject_id: e.target.value })}
            >
              {available.length === 0 ? (
                <option value="">Todas las materias ya están asignadas</option>
              ) : (
                available.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))
              )}
            </select>
            <Input type="number" min={1} max={40} value={newRow.hours} onChange={(e) => setNewRow({ ...newRow, hours: Number(e.target.value) })} />
            <Button onClick={addRequirement} disabled={!newRow.subject_id}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>

          {requirements.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Todavía no hay materias asignadas a este curso.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2">Materia</th>
                  <th>Horas semanales</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => {
                  const subject = subjects.find((s) => s.id === req.subject_id);
                  return (
                    <tr key={req.subject_id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{subject?.name ?? req.subject_id}</td>
                      <td>
                        <Input className="h-8 w-24" type="number" min={0} max={40} value={req.weekly_blocks_required} onChange={(e) => updateHours(req.subject_id, Number(e.target.value))} />
                      </td>
                      <td className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => removeRequirement(req.subject_id)}>
                          <Trash2 className="h-4 w-4 text-rose-600" /> Quitar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="text-xs text-muted-foreground">
            Total: <strong>{requirements.reduce((sum, r) => sum + r.weekly_blocks_required, 0)} hs semanales</strong>
          </p>
        </div>
      )}

      {tab === "availability" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border bg-emerald-100 px-3 font-semibold text-emerald-900"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponible</span>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border bg-card px-3 font-semibold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-slate-300" /> No disponible</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[140px_repeat(5,1fr)] bg-muted/60 text-xs font-semibold text-muted-foreground">
                <div className="p-2">Bloque</div>
                {DAYS.map((d) => <div key={d} className="border-l p-2 text-center">{d}</div>)}
              </div>
              {rows.map((row) => {
                if (row.type !== "CLASS") {
                  return (
                    <div key={row.start_time} className="grid grid-cols-[140px_repeat(5,1fr)] border-t bg-amber-500/10 text-xs italic text-amber-700">
                      <div className="px-2 py-1.5 font-medium">{row.label}</div>
                      <div className="col-span-5 border-l px-2 py-1.5 text-center">
                        {row.type === "LUNCH" ? "Comida y recreo" : row.type === "MINI_BREAK" ? "Mini break" : "Recreo"}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={row.start_time} className="grid grid-cols-[140px_repeat(5,1fr)] border-t">
                    <div className="bg-muted/30 px-2 py-2 text-xs"><div className="font-medium">{row.label}</div></div>
                    {DAYS.map((_, day) => {
                      const block = row.perDay.find((p) => p.day_of_week === day);
                      if (!block) return <div key={day} className="border-l" />;
                      const checked = availability.has(block.id);
                      return (
                        <button key={day} type="button"
                          className={cn("min-h-14 border-l text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            checked ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200/70" : "bg-card text-muted-foreground hover:bg-muted")}
                          onClick={() => toggleBlock(block.id)}
                          aria-label={`${DAYS[day]} ${row.label}: ${checked ? "disponible" : "no disponible"}`}>
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
