"use client";

import { useState } from "react";
import { Building2, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Campus = {
  id: string;
  name: string;
  display_name: string | null;
  code: string;
  address: string | null;
  city: string | null;
  province: string | null;
  is_active: number;
};

export function CampusesClient({ initialCampuses, canCreate }: { initialCampuses: Campus[]; canCreate: boolean }) {
  const [campuses, setCampuses] = useState<Campus[]>(initialCampuses);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", code: "", city: "", province: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createCampus() {
    if (!draft.name.trim() || !draft.code.trim()) {
      setError("Nombre y código son obligatorios.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/campuses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "No se pudo crear la sede.");
        return;
      }
      setCampuses((current) => [data, ...current]);
      setDraft({ name: "", code: "", city: "", province: "", address: "" });
      setCreating(false);
    } finally {
      setBusy(false);
    }
  }

  async function archiveCampus(id: string) {
    if (!confirm("¿Desactivar esta sede?")) return;
    const res = await fetch(`/api/campuses/${id}`, { method: "DELETE" });
    if (res.ok) setCampuses((current) => current.filter((c) => c.id !== id));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sedes</CardTitle>
        {canCreate && (
          <Button size="sm" onClick={() => setCreating((v) => !v)}>
            <Plus className="h-4 w-4" /> Nueva sede
          </Button>
        )}
      </CardHeader>
      {creating && (
        <CardContent className="border-t bg-secondary/40">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input placeholder="Código (ej. NFD-NOR)" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            <Input placeholder="Ciudad" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
            <Input placeholder="Provincia" value={draft.province} onChange={(e) => setDraft({ ...draft, province: e.target.value })} />
            <Input className="sm:col-span-2" placeholder="Dirección" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          </div>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={createCampus} disabled={busy}>
              {busy ? "Creando..." : "Crear sede"}
            </Button>
          </div>
        </CardContent>
      )}
      <CardContent className="grid gap-4 md:grid-cols-2">
        {campuses.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay sedes cargadas todavía.
          </div>
        )}
        {campuses.map((campus) => (
          <div key={campus.id} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold">
                <Building2 className="h-4 w-4 text-orange-600" /> {campus.name}
              </h3>
              <Badge>{campus.code}</Badge>
            </div>
            {(campus.address || campus.city) && (
              <p className="mt-3 text-sm text-muted-foreground">
                {[campus.address, campus.city, campus.province].filter(Boolean).join(", ")}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between">
              <Badge className={campus.is_active ? "bg-green-500/10 text-green-700" : "bg-muted text-muted-foreground"}>
                {campus.is_active ? "Activa" : "Inactiva"}
              </Badge>
              {canCreate && (
                <Button size="sm" variant="ghost" onClick={() => archiveCampus(campus.id)}>
                  <Trash2 className="h-4 w-4 text-rose-600" /> Desactivar
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
