"use client";

import { useState } from "react";
import { DoorOpen, Edit3, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Room = { id: string; campusId: string; name: string; type: string; capacity: number; restrictions?: string | null };

const roomLabels: Record<string, string> = {
  REGULAR: "Regular",
  LABORATORY: "Laboratorio",
  COMPUTER_ROOM: "Informática",
  SPECIAL: "Especial",
  MAKER_ROOM: "Maker",
  WORKSHOP: "Taller"
};

export function ClassroomsClient({ initialRooms, campusId, canEdit }: { initialRooms: Room[]; campusId: string; canEdit: boolean }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", type: "REGULAR", capacity: 30, restrictions: "" });

  function createRoom() {
    if (!draft.name.trim()) return;
    setRooms((current) => [{ id: `local-room-${Date.now()}`, campusId, ...draft }, ...current]);
    setDraft({ name: "", type: "REGULAR", capacity: 30, restrictions: "" });
    setCreating(false);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Inventario de aulas</CardTitle>
          {canEdit && <Button size="sm" onClick={() => setCreating((value) => !value)}>
            <Plus className="h-4 w-4" />
            Nueva aula
          </Button>}
        </CardHeader>
        <CardContent>
          {creating && (
            <div className="mb-4 grid gap-3 rounded-2xl border bg-secondary/40 p-4 sm:grid-cols-5">
              <Input placeholder="Nombre" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
                {Object.entries(roomLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <Input type="number" value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) })} />
              <Input className="sm:col-span-1" placeholder="Restricciones" value={draft.restrictions} onChange={(event) => setDraft({ ...draft, restrictions: event.target.value })} />
              <Button onClick={createRoom}>Guardar</Button>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-semibold">
                      <DoorOpen className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{room.name}</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{room.restrictions}</p>
                  </div>
                  <Badge>{roomLabels[room.type] ?? room.type}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2 text-sm">
                  <span>{room.capacity} lugares</span>
                  {canEdit && <Button size="sm" variant="ghost"><Edit3 className="h-4 w-4" />Editar</Button>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
