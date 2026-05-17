"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Trash2, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FullScreenModal } from "@/components/ui/full-screen-modal";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  campus_id: string;
  name: string;
  type: string;
  description: string | null;
  fixed_time_block_id: string | null;
  weekly_blocks_required: number;
  flexible: number;
  notes: string | null;
  teacher_ids: string[];
  course_ids: string[];
};
type Teacher = { id: string; full_name: string };
type Course = { id: string; name: string };
type TimeBlock = { id: string; day_of_week: number; block_index: number; start_time: string; end_time: string; label: string; type: string };

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

const typeOptions: { value: Project["type"]; label: string }[] = [
  { value: "PROJECT", label: "Proyecto" },
  { value: "ELECTIVE", label: "Electiva" },
  { value: "OPTATIVE", label: "Optativa" },
  { value: "WORKSHOP", label: "Taller" },
  { value: "CITIZENSHIP", label: "Ciudadanos" },
  { value: "INTERDISCIPLINARY", label: "Interdisciplinario" }
];

const typeLabel = (t: string) => typeOptions.find((o) => o.value === t)?.label ?? t;

export function ProjectsClient({
  initialProjects,
  teachers,
  courses,
  timeBlocks,
  campusId,
  canEdit
}: {
  initialProjects: Project[];
  teachers: Teacher[];
  courses: Course[];
  timeBlocks: TimeBlock[];
  campusId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  if (!campusId) {
    return <div className="p-8"><Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Seleccioná una sede.</CardContent></Card></div>;
  }

  async function save(form: ProjectForm, projectId?: string) {
    const url = projectId ? `/api/projects/${projectId}` : "/api/projects";
    const method = projectId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ campusId, ...form })
    });
    if (!res.ok) return false;
    const row = (await res.json()) as Project;
    setProjects((cur) => projectId ? cur.map((p) => p.id === row.id ? row : p) : [row, ...cur]);
    router.refresh();
    return true;
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar proyecto/electiva?")) return;
    const res = await fetch(`/api/projects/${id}?campusId=${campusId}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((cur) => cur.filter((p) => p.id !== id));
      if (editing?.id === id) setEditing(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-end">
        {canEdit && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Crear proyecto/electiva
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Workflow className="mx-auto h-8 w-8 text-orange-500" />
            <p className="mt-3 font-semibold">Todavía no hay proyectos cargados.</p>
            <p className="mt-1 text-sm text-muted-foreground">Creá una electiva, optativa o proyecto interdisciplinario.</p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Crear primer proyecto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-orange-600" /> {project.name}
                  </CardTitle>
                  <Badge>{typeLabel(project.type)}</Badge>
                </div>
                {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-2xl border p-3 text-sm">
                    <div className="mb-1 font-semibold">Docentes</div>
                    <div className="flex flex-wrap gap-1">
                      {project.teacher_ids.length === 0
                        ? <span className="text-xs text-muted-foreground">Sin asignar</span>
                        : project.teacher_ids.map((id) => <Badge key={id}>{teachers.find((t) => t.id === id)?.full_name ?? id}</Badge>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-3 text-sm">
                    <div className="mb-1 font-semibold">Cursos</div>
                    <div className="flex flex-wrap gap-1">
                      {project.course_ids.length === 0
                        ? <span className="text-xs text-muted-foreground">Sin asignar</span>
                        : project.course_ids.map((id) => <Badge key={id}>{courses.find((c) => c.id === id)?.name ?? id}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-secondary">{project.weekly_blocks_required} bloque{project.weekly_blocks_required === 1 ? "" : "s"} semanales</Badge>
                  <Badge className={project.flexible ? "bg-green-500/10 text-green-700" : "bg-orange-500/10 text-orange-700"}>
                    {project.flexible ? "Flexible" : "Bloque fijo"}
                  </Badge>
                  {project.fixed_time_block_id && (() => {
                    const tb = timeBlocks.find((b) => b.id === project.fixed_time_block_id);
                    if (!tb) return null;
                    return <Badge>{DAYS[tb.day_of_week]} · {tb.label}</Badge>;
                  })()}
                </div>
                {project.notes && <p className="text-sm text-muted-foreground">{project.notes}</p>}
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(project)}>
                      <Edit3 className="h-4 w-4" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(project.id)}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <ProjectFormModal
          title="Crear proyecto/electiva"
          initial={{ name: "", type: "PROJECT", description: "", weekly_blocks_required: 1, flexible: true, fixed_time_block_id: null, notes: "", teacher_ids: [], course_ids: [] }}
          teachers={teachers}
          courses={courses}
          timeBlocks={timeBlocks}
          onClose={() => setCreating(false)}
          onSubmit={async (form) => { if (await save(form)) setCreating(false); }}
        />
      )}
      {editing && (
        <ProjectFormModal
          title={`Editar · ${editing.name}`}
          initial={{
            name: editing.name,
            type: editing.type,
            description: editing.description ?? "",
            weekly_blocks_required: editing.weekly_blocks_required,
            flexible: editing.flexible === 1,
            fixed_time_block_id: editing.fixed_time_block_id,
            notes: editing.notes ?? "",
            teacher_ids: editing.teacher_ids,
            course_ids: editing.course_ids
          }}
          teachers={teachers}
          courses={courses}
          timeBlocks={timeBlocks}
          onClose={() => setEditing(null)}
          onDelete={() => remove(editing.id)}
          onSubmit={async (form) => { if (await save(form, editing.id)) setEditing(null); }}
        />
      )}
    </div>
  );
}

type ProjectForm = {
  name: string;
  type: string;
  description: string;
  weekly_blocks_required: number;
  flexible: boolean;
  fixed_time_block_id: string | null;
  notes: string;
  teacher_ids: string[];
  course_ids: string[];
};

function ProjectFormModal({
  title,
  initial,
  teachers,
  courses,
  timeBlocks,
  onClose,
  onSubmit,
  onDelete
}: {
  title: string;
  initial: ProjectForm;
  teachers: Teacher[];
  courses: Course[];
  timeBlocks: TimeBlock[];
  onClose: () => void;
  onSubmit: (form: ProjectForm) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<ProjectForm>(initial);

  function toggleTeacher(id: string) {
    setForm((f) => ({ ...f, teacher_ids: f.teacher_ids.includes(id) ? f.teacher_ids.filter((x) => x !== id) : [...f.teacher_ids, id] }));
  }
  function toggleCourse(id: string) {
    setForm((f) => ({ ...f, course_ids: f.course_ids.includes(id) ? f.course_ids.filter((x) => x !== id) : [...f.course_ids, id] }));
  }

  return (
    <FullScreenModal
      title={title}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          {onDelete ? (
            <Button variant="ghost" className="text-rose-600" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          ) : <span />}
          <Button onClick={() => onSubmit(form)} disabled={!form.name.trim()}>Guardar</Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Nombre</span>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Tipo</span>
            <select
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Bloques semanales requeridos</span>
            <Input type="number" min={1} max={20} value={form.weekly_blocks_required} onChange={(e) => setForm({ ...form, weekly_blocks_required: Math.max(1, Number(e.target.value)) })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Modo</span>
            <select
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              value={form.flexible ? "flexible" : "fixed"}
              onChange={(e) => setForm({ ...form, flexible: e.target.value === "flexible", fixed_time_block_id: e.target.value === "flexible" ? null : form.fixed_time_block_id })}
            >
              <option value="flexible">Flexible</option>
              <option value="fixed">Bloque fijo</option>
            </select>
          </label>
          {!form.flexible && (
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Bloque fijo</span>
              <select
                className="h-10 rounded-xl border bg-background px-3 text-sm"
                value={form.fixed_time_block_id ?? ""}
                onChange={(e) => setForm({ ...form, fixed_time_block_id: e.target.value || null })}
              >
                <option value="">Seleccionar...</option>
                {timeBlocks.map((tb) => (
                  <option key={tb.id} value={tb.id}>{DAYS[tb.day_of_week]} · {tb.label}</option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Descripción</span>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Notas</span>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Docentes involucrados</p>
          {teachers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay docentes todavía.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {teachers.map((t) => {
                const checked = form.teacher_ids.includes(t.id);
                return (
                  <label key={t.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm", checked && "bg-primary/10 text-primary")}>
                    <input type="checkbox" checked={checked} onChange={() => toggleTeacher(t.id)} />
                    {t.full_name}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Cursos involucrados</p>
          {courses.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay cursos todavía.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {courses.map((c) => {
                const checked = form.course_ids.includes(c.id);
                return (
                  <label key={c.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm", checked && "bg-primary/10 text-primary")}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCourse(c.id)} />
                    {c.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FullScreenModal>
  );
}
