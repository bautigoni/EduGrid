"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { days, scheduleEntries, slots } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Entry = (typeof scheduleEntries)[number];

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
    </div>
  );
}

function Cell({ day, slot, children }: { day: number; slot: number; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${day}-${slot}` });
  return (
    <div
      ref={setNodeRef}
      className={cn("min-h-[94px] border-l border-t p-1.5 transition", isOver && "bg-primary/10")}
    >
      {children}
    </div>
  );
}

export function ScheduleCalendar() {
  const [entries, setEntries] = useState(scheduleEntries);
  const [message, setMessage] = useState<{ type: "ok" | "bad"; text: string }>({
    type: "ok",
    text: "Drag a lesson to validate a manual adjustment."
  });

  const byCell = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = `${entry.day}-${entry.slot}`;
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

    const [day, slot] = over.split("-").map(Number);
    const response = await fetch("/api/scheduler/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day, slot })
    });
    const validation = await response.json();

    if (!validation.valid) {
      setMessage({ type: "bad", text: validation.conflicts[0] });
      return;
    }

    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, day, slot } : entry)));
    setMessage({ type: "ok", text: "Move accepted. No teacher, classroom, or course conflicts detected." });
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
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid grid-cols-[82px_repeat(5,minmax(140px,1fr))] bg-muted/60">
            <div className="p-3 text-xs font-semibold text-muted-foreground">Time</div>
            {days.map((day) => (
              <div key={day} className="border-l p-3 text-center text-sm font-semibold">
                {day}
              </div>
            ))}
          </div>
          {slots.map((time, slot) => (
            <div key={time} className="grid grid-cols-[82px_repeat(5,minmax(140px,1fr))]">
              <div className="border-t bg-muted/30 p-3 text-xs text-muted-foreground">{time}</div>
              {days.map((_, day) => {
                const key = `${day}-${slot}`;
                return (
                  <Cell key={key} day={day} slot={slot}>
                    <div className="space-y-1.5">
                      {(byCell.get(key) ?? []).map((entry) => (
                        <Lesson key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </Cell>
                );
              })}
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
