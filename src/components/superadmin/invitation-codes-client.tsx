"use client";

import { useState } from "react";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Code = {
  id: string;
  code: string;
  campusId: string | null;
  role: string;
  label: string;
  isActive: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  requiresApproval: boolean;
};

type Campus = { id: string; name: string };

const roles: { value: string; label: string }[] = [
  { value: "COORDINADOR_HORARIOS", label: "Coordinador de horarios" },
  { value: "SUPERADMIN", label: "Superadmin" }
];

function randomCode() {
  return `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${new Date().getFullYear()}`;
}

export function InvitationCodesClient({ initialCodes, campuses }: { initialCodes: Code[]; campuses: Campus[] }) {
  const [codes, setCodes] = useState<Code[]>(initialCodes);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    code: "",
    campusId: campuses[0]?.id ?? "",
    role: "COORDINADOR_HORARIOS",
    label: "",
    expiresAt: "",
    maxUses: "",
    requiresApproval: false
  });

  function copyCode(value: string) {
    navigator.clipboard?.writeText(value).catch(() => null);
  }

  function createCode() {
    if (!draft.label.trim()) return;
    const code = (draft.code.trim() || randomCode()).toUpperCase();
    setCodes((current) => [
      {
        id: `local-${Date.now()}`,
        code,
        campusId: draft.role === "SUPERADMIN" ? null : draft.campusId,
        role: draft.role,
        label: draft.label.trim(),
        isActive: true,
        expiresAt: draft.expiresAt || null,
        maxUses: draft.maxUses ? Number(draft.maxUses) : null,
        usedCount: 0,
        requiresApproval: draft.requiresApproval
      },
      ...current
    ]);
    setCreating(false);
    setDraft({ code: "", campusId: campuses[0]?.id ?? "", role: "COORDINADOR_HORARIOS", label: "", expiresAt: "", maxUses: "", requiresApproval: false });
  }

  function toggleActive(id: string) {
    setCodes((current) => current.map((entry) => (entry.id === id ? { ...entry, isActive: !entry.isActive } : entry)));
  }

  function removeCode(id: string) {
    setCodes((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Códigos activos</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">El código define la sede y los permisos de cada cuenta.</p>
          </div>
          <Button onClick={() => setCreating((v) => !v)}>
            <Plus className="h-4 w-4" />
            Nuevo código
          </Button>
        </CardHeader>
        {creating && (
          <CardContent className="border-t">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input placeholder="Etiqueta interna" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              <Input placeholder="Código (auto si se deja vacío)" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} className="font-mono uppercase tracking-wider" />
              <select
                className="h-10 rounded-xl border bg-background px-3 text-sm"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {draft.role !== "SUPERADMIN" && (
                <select
                  className="h-10 rounded-xl border bg-background px-3 text-sm"
                  value={draft.campusId}
                  onChange={(e) => setDraft({ ...draft, campusId: e.target.value })}
                >
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              )}
              <Input type="date" placeholder="Vence" value={draft.expiresAt} onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })} />
              <Input type="number" placeholder="Usos máximos (vacío = ilimitado)" value={draft.maxUses} onChange={(e) => setDraft({ ...draft, maxUses: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.requiresApproval}
                  onChange={(e) => setDraft({ ...draft, requiresApproval: e.target.checked })}
                />
                Requiere aprobación manual
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
              <Button onClick={createCode}>Crear código</Button>
            </div>
          </CardContent>
        )}
        <CardContent>
          {codes.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Todavía no hay códigos de invitación.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3">Código</th>
                    <th>Etiqueta</th>
                    <th>Sede</th>
                    <th>Rol</th>
                    <th>Usos</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((entry) => {
                    const campus = entry.campusId ? campuses.find((c) => c.id === entry.campusId)?.name : "Global";
                    return (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-primary" />
                            <code className="font-mono text-xs">{entry.code}</code>
                          </div>
                        </td>
                        <td>{entry.label}</td>
                        <td>{campus ?? "—"}</td>
                        <td>{entry.role === "SUPERADMIN" ? "Superadmin" : "Coordinador"}</td>
                        <td>
                          {entry.usedCount}
                          {entry.maxUses != null && ` / ${entry.maxUses}`}
                        </td>
                        <td>
                          {entry.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Activo</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground">Inactivo</Badge>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => copyCode(entry.code)}>
                              <Copy className="h-4 w-4" />
                              Copiar
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => toggleActive(entry.id)}>
                              {entry.isActive ? "Desactivar" : "Activar"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => removeCode(entry.id)}>
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
