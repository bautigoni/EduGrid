"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileDown, FileSpreadsheet, Filter, Loader2, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { days, scheduleEntries, timeBlocks } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Entry = (typeof scheduleEntries)[number];
type ViewMode = "course" | "teacher" | "subject";

const viewLabels: Record<ViewMode, string> = {
  course: "Por curso",
  teacher: "Por docente",
  subject: "Por materia"
};

const breakStyles: Record<string, string> = {
  BREAK: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  MINI_BREAK: "bg-amber-400/10 text-amber-700 dark:text-amber-300",
  LUNCH: "bg-orange-500/10 text-orange-700 dark:text-orange-300"
};

export function PlannerClient({
  initialEntries,
  teachers,
  courses,
  subjects,
  campusId
}: {
  initialEntries: Entry[];
  teachers: string[];
  courses: string[];
  subjects: string[];
  campusId: string;
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [view, setView] = useState<ViewMode>("course");
  const [filterValue, setFilterValue] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const filterOptions = useMemo(() => {
    if (view === "course") return courses;
    if (view === "teacher") return teachers;
    return subjects;
  }, [view, courses, teachers, subjects]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filterValue !== "all") {
        if (view === "course" && !entry.course.includes(filterValue)) return false;
        if (view === "teacher" && !entry.teacher.includes(filterValue)) return false;
        if (view === "subject" && !entry.subject.includes(filterValue)) return false;
      }
      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        const haystack = `${entry.course} ${entry.subject} ${entry.teacher} ${entry.classroom}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [entries, view, filterValue, search]);

  const byCell = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of filteredEntries) {
      const key = `${entry.day}-${entry.blockIndex}`;
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return map;
  }, [filteredEntries]);

  async function generate() {
    setGenerating(true);
    setStatus(null);
    try {
      const response = await fetch("/api/scheduler/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId })
      });
      const data = await response.json();
      if (Array.isArray(data.entries) && data.entries.length > 0) {
        setEntries(data.entries);
      }
      setStatus(`${data.entries?.length ?? 0} bloques horarios ubicados.`);
    } catch {
      setStatus("No se pudo generar el horario.");
    } finally {
      setGenerating(false);
    }
  }

  function clearFilters() {
    setFilterValue("all");
    setSearch("");
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Horario semanal</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Generá, filtrá y exportá el horario institucional.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={generate} disabled={generating} size="lg">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generar horario
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/api/export/excel?campusId=${campusId}`}>
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/api/export/pdf?campusId=${campusId}`}>
                <FileDown className="h-4 w-4" />
                Exportar PDF
              </Link>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-2xl bg-secondary p-1">
              {(Object.keys(viewLabels) as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setView(mode);
                    setFilterValue("all");
                  }}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                    view === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {viewLabels[mode]}
                </button>
              ))}
            </div>
            <select
              aria-label="Filtro"
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              className="h-9 rounded-xl border bg-background px-3 text-sm"
            >
              <option value="all">Todos</option>
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Input
              placeholder="Buscar"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 max-w-[220px]"
            />
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <Filter className="h-4 w-4" />
              Limpiar filtros
            </Button>
            {status && <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{status}</Badge>}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border bg-card print:border-0">
        <div className="overflow-x-auto">
          <div className="grid min-w-[860px] grid-cols-[140px_repeat(5,1fr)]">
            <div className="sticky top-0 z-10 bg-muted/60 p-3 text-xs font-semibold text-muted-foreground">Bloque</div>
            {days.map((day) => (
              <div
                key={`planner-heading-${day}`}
                className="sticky top-0 z-10 border-l bg-muted/60 p-3 text-center text-sm font-semibold"
              >
                {day}
              </div>
            ))}
            {timeBlocks.map((block, rowIndex) => {
              if (!block.isAssignable) {
                return (
                  <div
                    key={`planner-break-${rowIndex}`}
                    className={cn(
                      "col-span-6 grid grid-cols-[140px_repeat(5,1fr)] border-t text-xs italic",
                      breakStyles[block.type]
                    )}
                  >
                    <div className="px-3 py-2 font-medium">{block.label}</div>
                    <div className="col-span-5 border-l px-3 py-2 text-center">{block.breakLabel}</div>
                  </div>
                );
              }
              const blockIndex = block.blockIndex!;
              return (
                <div
                  key={`planner-row-${blockIndex}`}
                  className="col-span-6 grid grid-cols-[140px_repeat(5,1fr)]"
                >
                  <div className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">{block.label}</div>
                    <div className="text-[10px] uppercase tracking-wide">{block.durationMinutes} min</div>
                  </div>
                  {days.map((_, day) => {
                    const key = `${day}-${blockIndex}`;
                    const cellEntries = byCell.get(key) ?? [];
                    return (
                      <div key={key} className="min-h-[96px] border-l border-t p-2">
                        <div className="space-y-1.5">
                          {cellEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-xl border p-2 text-left shadow-sm"
                              style={{ borderColor: entry.color, backgroundColor: `${entry.color}1f` }}
                            >
                              <div className="truncate text-sm font-semibold">{entry.subject}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {entry.course} · {entry.teacher}
                              </div>
                              <div className="mt-1 truncate text-[11px] text-muted-foreground">{entry.classroom}</div>
                            </div>
                          ))}
                          {cellEntries.length === 0 && <div className="h-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">Todavía no generaste ningún horario.</p>
          <p className="mt-1 text-sm text-muted-foreground">Tocá <strong>Generar horario</strong> para que el motor arme la grilla.</p>
        </div>
      )}
    </div>
  );
}
