"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FullScreenModal } from "@/components/ui/full-screen-modal";

type Subject = {
  id: string;
  campus_id: string;
  name: string;
  code: string | null;
  color: string | null;
  notes: string | null;
};

export function SubjectsClient({
  initialSubjects,
  campusId,
  canEdit
}: {
  initialSubjects: Subject[];
  campusId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [draftOpen, setDraftOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [busy, setBusy] = useState(false);

  if (!campusId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Seleccioná una sede para ver y crear materias.
          </CardContent>
        </Card>
      </div>
    );
  }

  async function create(form: { name: string; code: string; color: string; notes: string }) {
    setBusy(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, ...form })
      });
      if (res.ok) {
        const created = (await res.json()) as Subject;
        setSubjects((cur) => [created, ...cur]);
        setDraftOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, patch: Partial<Subject>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, ...patch })
      });
      if (res.ok) {
        const updated = (await res.json()) as Subject;
        setSubjects((cur) => cur.map((s) => (s.id === id ? updated : s)));
        setEditing(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar materia?")) return;
    const res = await fetch(`/api/subjects/${id}?campusId=${campusId}`, { method: "DELETE" });
    if (res.ok) {
      setSubjects((cur) => cur.filter((s) => s.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Catálogo de materias</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Sólo el catálogo. Las horas semanales se configuran dentro de cada curso.</p>
          </div>
          {canEdit && (
            <Button onClick={() => setDraftOpen(true)}>
              <Plus className="h-4 w-4" /> Agregar materia
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-semibold">No hay materias cargadas.</p>
              <p className="mt-1 text-sm text-muted-foreground">Comenzá creando tu primera materia.</p>
              {canEdit && (
                <Button className="mt-4" onClick={() => setDraftOpen(true)}>
                  <Plus className="h-4 w-4" /> Crear primera materia
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
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
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color ?? "#ccc" }} />
                        <span className="font-semibold">{subject.name}</span>
                      </div>
                    </td>
                    <td>{subject.code && <Badge>{subject.code}</Badge>}</td>
                    <td><code className="font-mono text-xs text-muted-foreground">{subject.color}</code></td>
                    <td className="text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="secondary" onClick={() => setEditing(subject)}>
                            <Edit3 className="h-4 w-4" /> Editar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(subject.id)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {draftOpen && (
        <SubjectForm
          title="Crear materia"
          initial={{ name: "", code: "", color: "#FDBA74", notes: "" }}
          busy={busy}
          onClose={() => setDraftOpen(false)}
          onSubmit={create}
        />
      )}
      {editing && (
        <SubjectForm
          title={`Editar materia · ${editing.name}`}
          initial={{ name: editing.name, code: editing.code ?? "", color: editing.color ?? "#FDBA74", notes: editing.notes ?? "" }}
          busy={busy}
          onClose={() => setEditing(null)}
          onSubmit={(form) => update(editing.id, form)}
        />
      )}
    </div>
  );
}

function SubjectForm({
  title,
  initial,
  busy,
  onClose,
  onSubmit
}: {
  title: string;
  initial: { name: string; code: string; color: string; notes: string };
  busy: boolean;
  onClose: () => void;
  onSubmit: (form: { name: string; code: string; color: string; notes: string }) => void;
}) {
  const [form, setForm] = useState(initial);
  return (
    <FullScreenModal title={title} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Nombre</span>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Código (opcional)</span>
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Color</span>
          <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10" />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-muted-foreground">Notas (opcional)</span>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" /> Cancelar
        </Button>
        <Button onClick={() => onSubmit(form)} disabled={busy || !form.name.trim()}>
          {busy ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </FullScreenModal>
  );
}
