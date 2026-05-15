"use client";

import { useEffect, useState } from "react";
import { days, timeBlocks } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Cell = [number, number]; // [day(0-4), blockIndex(1-7)]

const breakStyles: Record<string, string> = {
  BREAK: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  MINI_BREAK: "bg-amber-400/10 text-amber-700 dark:text-amber-300",
  LUNCH: "bg-orange-500/10 text-orange-700 dark:text-orange-300"
};

export function AvailabilityGrid({
  unavailable = [],
  onChange,
  readOnly = false,
  entity = "teacher"
}: {
  unavailable?: Cell[];
  onChange?: (next: Cell[]) => void;
  readOnly?: boolean;
  entity?: "teacher" | "course";
}) {
  const [cells, setCells] = useState<Set<string>>(() =>
    new Set(unavailable.map(([day, blockIndex]) => `${day}-${blockIndex}`))
  );

  useEffect(() => {
    setCells(new Set(unavailable.map(([day, blockIndex]) => `${day}-${blockIndex}`)));
  }, [unavailable]);

  function toggle(day: number, blockIndex: number) {
    if (readOnly) return;
    setCells((current) => {
      const key = `${day}-${blockIndex}`;
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      const parsed: Cell[] = Array.from(next).map((value) => {
        const [d, b] = value.split("-").map(Number);
        return [d, b];
      });
      onChange?.(parsed);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border">
      <div className="min-w-[640px]">
      <div className="grid grid-cols-[120px_repeat(5,1fr)] bg-muted/60 text-xs font-semibold text-muted-foreground">
        <div className="p-2">Bloque</div>
        {days.map((day) => (
          <div key={`availability-heading-${day}`} className="border-l p-2 text-center">
            {day}
          </div>
        ))}
      </div>
      {timeBlocks.map((block, rowIndex) => {
        if (!block.isAssignable) {
          return (
            <div
              key={`break-${rowIndex}`}
              className={cn(
                "grid grid-cols-[120px_repeat(5,1fr)] border-t text-[11px] italic",
                breakStyles[block.type]
              )}
            >
              <div className="px-2 py-1.5 font-medium">{block.label}</div>
              <div className="col-span-5 border-l px-2 py-1.5 text-center">{block.breakLabel}</div>
            </div>
          );
        }
        const blockIndex = block.blockIndex!;
        return (
          <div key={`row-${blockIndex}`} className="grid grid-cols-[120px_repeat(5,1fr)] border-t">
            <div className="bg-muted/30 px-2 py-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">{block.label}</div>
              <div className="text-[10px] uppercase tracking-wide">{block.durationMinutes} min</div>
            </div>
            {days.map((_, day) => {
              const key = `${day}-${blockIndex}`;
              const isUnavailable = cells.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={readOnly}
                  className={cn(
                    "min-h-12 border-l text-xs transition hover:bg-primary/10",
                    isUnavailable
                      ? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    readOnly && "cursor-default opacity-80"
                  )}
                  onClick={() => toggle(day, blockIndex)}
                  aria-label={`${entity === "teacher" ? "Docente" : "Curso"} ${isUnavailable ? "no disponible" : "disponible"} ${days[day]} ${block.label}`}
                >
                  {isUnavailable ? "No disponible" : "Disponible"}
                </button>
              );
            })}
          </div>
        );
      })}
      </div>
    </div>
  );
}
