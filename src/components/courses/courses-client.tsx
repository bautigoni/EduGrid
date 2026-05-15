"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { AvailabilityGrid } from "@/components/scheduler/availability-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Course = {
  id: string;
  campusId: string;
  label: string;
  year: number;
  division: string;
  studentCount: number;
  defaultClassroom?: string;
  unavailable?: number[][];
};

type CourseSubjectLink = {
  campusId: string;
  course: string;
  subject: string;
  weeklyBlocksRequired: number;
  distribution?: string;
};

type SubjectCatalog = { id: string; name: string; color: string };

type EditTab = "data" | "subjects" | "availability";

export function CoursesClient({
  initialCourses,
  courseSubjects,
  subjectsCatalog,
  campusId,
  canEdit
}: {
  initialCourses: Course[];
  courseSubjects: CourseSubjectLink[];
  subjectsCatalog: SubjectCatalog[];
  campusId: string;
  canEdit: boolean;
}) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [links, setLinks] = useState<CourseSubjectLink[]>(courseSubjects);
  const [year, setYear] = useState("all");
  const [division, setDivision] = useState("all");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ year: 1, division: "N", studentCount: 28 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<EditTab>("data");

  const filtered = useMemo(
    () =>
      courses.filter(
        (course) =>
          (year === "all" || course.year === Number(year)) &&
          (division === "all" || course.division === division)
      ),
    [courses, division, year]
  );

  const editing = courses.find((course) => course.id === editingId) ?? null;
  const editingLinks = editing ? links.filter((l) => l.campusId === editing.campusId && l.course === editing.label) : [];

  function createCourse() {
    const label = `${draft.year}${draft.division}`;
    if (courses.some((course) => course.label === label && course.campusId === campusId)) return;
    setCourses((current) => [
      {
        id: `local-course-${Date.now()}`,
        campusId,
        label,
        defaultClassroom: `Aula ${label}`,
        unavailable: [],
        ...draft
      },
      ...current
    ]);
    setCreating(false);
  }

  function deleteCourse(id: string) {
    const target = courses.find((c) => c.id === id);
    setCourses((current) => current.filter((course) => course.id !== id));
    if (target) {
      setLinks((current) => current.filter((l) => !(l.campusId === target.campusId && l.course === target.label)));
    }
    if (editingId === id) setEditingId(null);
  }

  function updateEditingData(patch: Partial<Course>) {
    if (!editing) return;
    const previousLabel = editing.label;
    setCourses((current) => current.map((course) => (course.id === editing.id ? { ...course, ...patch } : course)));
    if (patch.label && patch.label !== previousLabel) {
      setLinks((current) =>
        current.map((l) => (l.campusId === editing.campusId && l.course === previousLabel ? { ...l, course: patch.label! } : l))
      );
    }
  }

  function addSubjectToCourse(name: string, hours: number) {
    if (!editing || !name.trim()) return;
    if (editingLinks.some((l) => l.subject === name)) return;
    setLinks((current) => [
      ...current,
      { campusId: editing.campusId, course: editing.label, subject: name, weeklyBlocksRequired: Math.max(1, hours) }
    ]);
  }

  function updateSubjectHours(subjectName: string, hours: number) {
    if (!editing) return;
    setLinks((current) =>
      current.map((l) =>
        l.campusId === editing.campusId && l.course === editing.label && l.subject === subjectName
          ? { ...l, weeklyBlocksRequired: Math.max(0, hours) }
          : l
      )
    );
  }

  function removeSubjectFromCourse(subjectName: string) {
    if (!editing) return;
    setLinks((current) =>
      current.filter((l) => !(l.campusId === editing.campusId && l.course === editing.label && l.subject === subjectName))
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", "N", "F", "S"].map((item) => (
            <Button key={item} size="sm" variant={division === item ? "default" : "secondary"} onClick={() => setDivision(item)}>
              {item === "all" ? "Todas" : item}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "1", "2", "3", "4", "5", "6"].map((item) => (
            <Button key={item} size="sm" variant={year === item ? "default" : "outline"} onClick={() => setYear(item)}>
              {item === "all" ? "Años" : `${item}°`}
            </Button>
          ))}
        </div>
        {canEdit && (
          <Button onClick={() => setCreating((value) => !value)}>
            <Plus className="h-4 w-4" />
            Nuevo curso
          </Button>
        )}
      </div>

      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>Crear curso</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            <Input type="number" min={1} max={6} value={draft.year} onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })} />
            <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={draft.division} onChange={(event) => setDraft({ ...draft, division: event.target.value })}>
              <option value="N">N</option>
              <option value="F">F</option>
              <option value="S">S</option>
            </select>
            <Input type="number" value={draft.studentCount} onChange={(event) => setDraft({ ...draft, studentCount: Number(event.target.value) })} />
            <Button onClick={createCourse}>Guardar</Button>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 && !creating && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">No hay cursos cargados.</p>
          <p className="mt-1 text-sm text-muted-foreground">Empezá creando el primer curso de tu sede.</p>
          {canEdit && (
            <Button className="mt-4" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Crear primer curso
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((course) => {
          const cs = links.filter((item) => item.campusId === course.campusId && item.course === course.label);
          const totalBlocks = cs.reduce((sum, item) => sum + item.weeklyBlocksRequired, 0);
          return (
            <Card key={course.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{course.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">Año {course.year} · División {course.division}</p>
                  <p className="text-xs text-muted-foreground">Aula: {course.defaultClassroom ?? `Aula ${course.label}`}</p>
                </div>
                {canEdit && (
                  <Button size="sm" variant="secondary" onClick={() => { setEditingId(course.id); setTab("data"); }}>
                    <Edit3 className="h-4 w-4" />
                    Editar
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>{course.studentCount} estudiantes</Badge>
                  <Badge className="bg-primary/10 text-primary">{totalBlocks} hs semanales</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {cs.length ? (
                    cs.map((item) => (
                      <div key={`${course.id}-${item.subject}`} className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2 text-sm">
                        <span className="truncate">{item.subject}</span>
                        <span className="shrink-0 font-semibold">{item.weeklyBlocksRequired} hs</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed p-3 text-center text-sm text-muted-foreground">
                      Sin materias asignadas todavía.
                      {canEdit && (
                        <button
                          className="ml-1 font-semibold text-primary hover:underline"
                          onClick={() => { setEditingId(course.id); setTab("subjects"); }}
                        >
                          Agregar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <CourseEditDrawer
          course={editing}
          links={editingLinks}
          subjectsCatalog={subjectsCatalog}
          tab={tab}
          setTab={setTab}
          onClose={() => setEditingId(null)}
          onDelete={() => deleteCourse(editing.id)}
          onPatch={updateEditingData}
          onAddSubject={addSubjectToCourse}
          onUpdateHours={updateSubjectHours}
          onRemoveSubject={removeSubjectFromCourse}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

function CourseEditDrawer({
  course,
  links,
  subjectsCatalog,
  tab,
  setTab,
  onClose,
  onDelete,
  onPatch,
  onAddSubject,
  onUpdateHours,
  onRemoveSubject,
  canEdit
}: {
  course: Course;
  links: CourseSubjectLink[];
  subjectsCatalog: SubjectCatalog[];
  tab: EditTab;
  setTab: (tab: EditTab) => void;
  onClose: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<Course>) => void;
  onAddSubject: (name: string, hours: number) => void;
  onUpdateHours: (subject: string, hours: number) => void;
  onRemoveSubject: (subject: string) => void;
  canEdit: boolean;
}) {
  const [newSubject, setNewSubject] = useState({ name: subjectsCatalog[0]?.name ?? "", hours: 3 });
  const remaining = subjectsCatalog.filter((subject) => !links.some((link) => link.subject === subject.name));

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button aria-label="Cerrar" className="flex-1 bg-slate-950/50" onClick={onClose} />
      <aside className="flex h-full w-full max-w-2xl flex-col border-l bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Editar curso · {course.label}</h2>
            <p className="text-sm text-muted-foreground">Año {course.year} · División {course.division}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <nav className="flex gap-2 border-b px-5 py-2">
          {(["data", "subjects", "availability"] as EditTab[]).map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                tab === value ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {value === "data" && "Datos del curso"}
              {value === "subjects" && "Materias y horas"}
              {value === "availability" && "Disponibilidad"}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "data" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Nombre del curso</span>
                <Input value={course.label} onChange={(e) => onPatch({ label: e.target.value })} disabled={!canEdit} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Año</span>
                <Input type="number" min={1} max={12} value={course.year} onChange={(e) => onPatch({ year: Number(e.target.value) })} disabled={!canEdit} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">División</span>
                <Input value={course.division} onChange={(e) => onPatch({ division: e.target.value })} disabled={!canEdit} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Cantidad de estudiantes</span>
                <Input type="number" min={1} value={course.studentCount} onChange={(e) => onPatch({ studentCount: Number(e.target.value) })} disabled={!canEdit} />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Aula base (opcional)</span>
                <Input
                  value={course.defaultClassroom ?? ""}
                  onChange={(e) => onPatch({ defaultClassroom: e.target.value })}
                  placeholder={`Aula ${course.label}`}
                  disabled={!canEdit}
                />
              </label>
            </div>
          )}

          {tab === "subjects" && (
            <div className="space-y-4">
              {canEdit && (
                <div className="grid gap-3 rounded-2xl border bg-secondary/40 p-4 sm:grid-cols-[2fr_1fr_auto]">
                  <select
                    className="h-10 rounded-xl border bg-background px-3 text-sm"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  >
                    {remaining.length === 0 ? (
                      <option>Todas las materias ya están asignadas</option>
                    ) : (
                      remaining.map((subject) => (
                        <option key={subject.id} value={subject.name}>
                          {subject.name}
                        </option>
                      ))
                    )}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={newSubject.hours}
                    onChange={(e) => setNewSubject({ ...newSubject, hours: Number(e.target.value) })}
                  />
                  <Button
                    onClick={() => {
                      onAddSubject(newSubject.name, newSubject.hours);
                      setNewSubject({ name: remaining[1]?.name ?? newSubject.name, hours: 3 });
                    }}
                    disabled={remaining.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              )}

              {links.length === 0 ? (
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
                    {links.map((link) => (
                      <tr key={link.subject} className="border-b last:border-0">
                        <td className="py-2 font-medium">{link.subject}</td>
                        <td>
                          <Input
                            className="h-8 w-24"
                            type="number"
                            min={0}
                            max={40}
                            value={link.weeklyBlocksRequired}
                            onChange={(e) => onUpdateHours(link.subject, Number(e.target.value))}
                            disabled={!canEdit}
                          />
                        </td>
                        <td className="text-right">
                          {canEdit && (
                            <Button size="sm" variant="ghost" onClick={() => onRemoveSubject(link.subject)}>
                              <Trash2 className="h-4 w-4 text-rose-600" />
                              Quitar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-muted-foreground">
                Total: <strong>{links.reduce((sum, l) => sum + l.weeklyBlocksRequired, 0)} hs semanales</strong>
              </p>
            </div>
          )}

          {tab === "availability" && (
            <AvailabilityGrid
              unavailable={(course.unavailable ?? []) as [number, number][]}
              readOnly={!canEdit}
              entity="course"
              onChange={(next) => onPatch({ unavailable: next })}
            />
          )}
        </div>

        <footer className="flex items-center justify-between border-t p-4">
          {canEdit ? (
            <Button variant="ghost" className="text-rose-600" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Eliminar curso
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={onClose}>Cerrar</Button>
        </footer>
      </aside>
    </div>
  );
}
