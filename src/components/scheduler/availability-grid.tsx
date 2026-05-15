"use client";

import { useState } from "react";
import { days, slots } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function AvailabilityGrid({
  blocked = [
    [0, 0],
    [2, 6],
    [4, 7]
  ]
}: {
  blocked?: number[][];
}) {
  const [cells, setCells] = useState(() => {
    const set = new Set(blocked.map(([day, slot]) => `${day}-${slot}`));
    return set;
  });

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="grid grid-cols-[70px_repeat(5,minmax(74px,1fr))] bg-muted/60 text-xs font-semibold text-muted-foreground">
        <div className="p-2">Slot</div>
        {days.map((day) => (
          <div key={day} className="border-l p-2 text-center">
            {day}
          </div>
        ))}
      </div>
      {slots.map((time, slot) => (
        <div key={time} className="grid grid-cols-[70px_repeat(5,minmax(74px,1fr))] border-t">
          <div className="bg-muted/30 p-2 text-xs text-muted-foreground">{time}</div>
          {days.map((_, day) => {
            const key = `${day}-${slot}`;
            const blockedCell = cells.has(key);
            return (
              <button
                key={key}
                className={cn(
                  "min-h-10 border-l text-xs transition hover:bg-primary/10",
                  blockedCell
                    ? "bg-rose-500/12 text-rose-600 dark:text-rose-300"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                )}
                onClick={() =>
                  setCells((current) => {
                    const next = new Set(current);
                    if (next.has(key)) {
                      next.delete(key);
                    } else {
                      next.add(key);
                    }
                    return next;
                  })
                }
              >
                {blockedCell ? "Blocked" : "Open"}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
