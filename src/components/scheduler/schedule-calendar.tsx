"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { days, scheduleEntries, timeBlocks } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Entry = (typeof scheduleEntries)[number];

const kindLabels: Record<string, string> = {
  REGULAR: "Regular",
  PROJECT: "Proyecto",
  ELECTIVE: "Electiva",
  OPTATIVE: "Optativa",
  WORKSHOP: "Taller",
  CITIZENSHIP: "Ciudadanos",
  INTERDISCIPLINARY: "Interdisciplinario"
};

const breakStyles: Record<string, string> = {
  BREAK: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  MINI_BREAK: "bg-amber-400/10 text-amber-700 dark:text-amber-300",
  LUNCH: "bg-orange-500/10 text-orange-700 dark:text-orange-300"
};

function Lesson({ entry }: { entry: Entry }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: entry.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: entry.color, backgroundColor: `${entry.color}1f` }}
      className={cn(
        "rounded-xl border p-2 text-left shadow-sm transition",
        isDragging && "z-50 scale-[1.02] opacity-80 shadow-xl"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="truncate text-sm font-semibold">{entry.subject}</div>
      <div className="truncate text-xs text-muted-foreground">{entry.course} - {entry.teacher}</div>
      <div className="mt-1 truncate text-[11px] text-muted-foreground">{entry.classroom}</div>
      {entry.kind !== "REGULAR" && <Badge className="mt-2 max-w-full whitespace-normal bg-orange-500/10 text-orange-700">{kindLabels[entry.kind] ?? entry.kind}</Badge>}
    </div>
  );
}

function Cell({ day, blockIndex, children }: { day: number; blockIndex: number; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${day}-${blockIndex}` });
  return (
    <div
      ref={setNodeRef}
      className={cn("min-h-[94px] border-l border-t p-1.5 transition", isOver && "bg-primary/10")}
    >
      {children}
    </div>
  );
}

export function ScheduleCalendar({ initialEntries }: { initialEntries?: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries ?? scheduleEntries);
  const [message, setMessage] = useState<{ type: "ok" | "bad"; text: string }>({
    type: "ok",
    text: "Mové una clase para validar el ajuste manual."
  });

  const byCell = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = `${entry.day}-${entry.blockIndex}`;
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return map;
  }, [entries]);

  async function onDragEnd(event: DragEndEvent) {
    const over = event.over?.id?.toString();
    const id = event.active.id.toString();
    if (!over) {
      return;
    }

    const [day, blockIndex] = over.split("-").map(Number);
    const response = await fetch("/api/scheduler/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day, blockIndex, campusId: entries.find((entry) => entry.id === id)?.campusId, entryId: id })
    });
    const validation = await response.json();

    if (!validation.valid) {
      setMessage({ type: "bad", text: validation.conflicts[0] });
      return;
    }

    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, day, blockIndex } : entry)));
    setMessage({ type: "ok", text: "Movimiento aceptado. No se detectaron cruces de docente, curso o disponibilidad." });
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
          message.type === "ok" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
        )}
      >
        {message.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {message.text}
      </div>

      <DndContext modifiers={[restrictToWindowEdges]} onDragEnd={onDragEnd}>
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <div className="grid min-w-[820px] grid-cols-[120px_repeat(5,1fr)] bg-muted/60">
            <div className="p-3 text-xs font-semibold text-muted-foreground">Bloque</div>
            {days.map((day) => (
              <div key={`calendar-heading-${day}`} className="border-l p-3 text-center text-sm font-semibold">
                {day}
              </div>
            ))}
          </div>
          {timeBlocks.map((block, rowIndex) => {
            if (!block.isAssignable) {
              return (
                <div
                  key={`break-row-${rowIndex}`}
                  className={cn("grid min-w-[820px] grid-cols-[120px_repeat(5,1fr)] border-t text-xs italic", breakStyles[block.type])}
                >
                  <div className="px-3 py-2 font-medium">{block.label}</div>
                  <div className="col-span-5 border-l px-3 py-2 text-center">{block.breakLabel}</div>
                </div>
              );
            }
            const blockIndex = block.blockIndex!;
            return (
              <div key={`block-row-${blockIndex}`} className="grid min-w-[820px] grid-cols-[120px_repeat(5,1fr)]">
                <div className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{block.label}</div>
                  <div className="text-[10px] uppercase tracking-wide">{block.durationMinutes} min</div>
                </div>
                {days.map((_, day) => {
                  const key = `${day}-${blockIndex}`;
                  return (
                    <Cell key={key} day={day} blockIndex={blockIndex}>
                      <div className="space-y-1.5">
                        {(byCell.get(key) ?? []).map((entry) => (
                          <Lesson key={entry.id} entry={entry} />
                        ))}
                      </div>
                    </Cell>
                  );
                })}
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
