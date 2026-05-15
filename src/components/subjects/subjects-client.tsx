"use client";

import { useState } from "react";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Subject = {
  id: string;
  campusId: string | null;
  name: string;
  code: string;
  color: string;
  roomType?: string;
  isGlobal?: boolean;
  notes?: string;
};

export function SubjectsClient({ initialSubjects, canEdit }: { initialSubjects: Subject[]; canEdit: boolean }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", code: "", color: "#FDBA74", notes: "" });
  const editing = subjects.find((subject) => subject.id === editingId) ?? null;

  function createSubject() {
    if (!draft.name.trim()) return;
    setSubjects((current) => [
      {
        id: `local-subject-${Date.now()}`,
        campusId: null,
        isGlobal: true,
        roomType: "REGULAR",
        ...draft
      },
      ...current
    ]);
    setDraft({ name: "", code: "", color: "#FDBA74", notes: "" });
    setCreating(false);
  }

  function updateEditing(patch: Partial<Subject>) {
    if (!editing) return;
    setSubjects((current) => current.map((subject) => (subject.id === editing.id ? { ...subject, ...patch } : subject)));
  }

  function removeSubject(id: string) {
    setSubjects((current) => current.filter((subject) => subject.id !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Catálogo de materias</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Sólo el catálogo. Las horas semanales se configuran dentro de cada curso.
            </p>
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => setCreating((value) => !value)}>
              <Plus className="h-4 w-4" />
              Agregar materia
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {creating && (
            <div className="mb-4 grid gap-3 rounded-2xl border bg-secondary/40 p-4 sm:grid-cols-[2fr_1fr_auto_auto]">
              <Input placeholder="Materia" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              <Input placeholder="Código" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
              <Input type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} className="h-10 w-16" />
              <Button onClick={createSubject}>Guardar</Button>
              <Input
                className="sm:col-span-4"
                placeholder="Descripción (opcional)"
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              />
            </div>
          )}

          {subjects.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-semibold">No hay materias cargadas.</p>
              <p className="mt-1 text-sm text-muted-foreground">Comenzá creando tu primera materia.</p>
              {canEdit && (
                <Button className="mt-4" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" /> Crear primera materia
                </Button>
              )}
            </div>
          )}

          {subjects.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3">Materia</th>
                    <th>Código</th>
                    <th>Color</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                          <span className="font-semibold">{subject.name}</span>
                        </div>
                      </td>
                      <td>
                        <Badge>{subject.code}</Badge>
                      </td>
                      <td>
                        <code className="font-mono text-xs text-muted-foreground">{subject.color}</code>
                      </td>
                      <td className="text-right">
                        {canEdit && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="secondary" onClick={() => setEditingId(subject.id)}>
                              <Edit3 className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => removeSubject(subject.id)} title="Eliminar materia">
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setEditingId(null)}>
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Editar materia</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={editing.name} onChange={(e) => updateEditing({ name: e.target.value })} placeholder="Nombre" />
              <Input value={editing.code} onChange={(e) => updateEditing({ code: e.target.value })} placeholder="Código" />
              <Input type="color" value={editing.color} onChange={(e) => updateEditing({ color: e.target.value })} className="h-10" />
              <Input
                value={editing.notes ?? ""}
                onChange={(e) => updateEditing({ notes: e.target.value })}
                placeholder="Descripción (opcional)"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="ghost" onClick={() => removeSubject(editing.id)} className="text-rose-600">
                <Trash2 className="h-4 w-4" /> Eliminar materia
              </Button>
              <Button onClick={() => setEditingId(null)}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
