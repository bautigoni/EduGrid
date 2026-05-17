"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Action =
  | "courses"
  | "teachers"
  | "subjects"
  | "teacher_availability"
  | "course_availability"
  | "teacher_eligibility"
  | "projects"
  | "schedules"
  | "failed_generation"
  | "conflicts"
  | "reset_planner"
  | "reset_campus"
  | "reset_all";

const ACTIONS: Array<{
  id: Action;
  label: string;
  detail: string;
  confirm: string;
  variant: "destructive" | "danger";
  scope: "campus" | "global";
}> = [
  { id: "schedules", label: "Borrar horarios generados", detail: "Elimina versiones y asignaciones del horario.", confirm: "BORRAR HORARIOS", variant: "destructive", scope: "campus" },
  { id: "failed_generation", label: "Borrar generacion fallida", detail: "Descarta versiones DRAFT, GENERATING o FAILED sin tocar datos base.", confirm: "DESCARTAR GENERACION FALLIDA", variant: "destructive", scope: "campus" },
  { id: "conflicts", label: "Borrar conflictos", detail: "Limpia el registro de conflictos y advertencias.", confirm: "BORRAR CONFLICTOS", variant: "destructive", scope: "campus" },
  { id: "reset_planner", label: "Reiniciar planner", detail: "Limpia horarios, versiones y conflictos tecnicos. Conserva cursos, materias, docentes y disponibilidad.", confirm: "REINICIAR PLANNER", variant: "destructive", scope: "campus" },
  { id: "teacher_availability", label: "Borrar disponibilidades docentes", detail: "Quita los AVAILABLE/UNAVAILABLE cargados a los docentes.", confirm: "BORRAR DISPONIBILIDAD DOCENTE", variant: "destructive", scope: "campus" },
  { id: "course_availability", label: "Borrar disponibilidades de cursos", detail: "Quita los AVAILABLE/UNAVAILABLE cargados a los cursos.", confirm: "BORRAR DISPONIBILIDAD CURSOS", variant: "destructive", scope: "campus" },
  { id: "teacher_eligibility", label: "Borrar habilitaciones docente×materia×curso", detail: "Vacía la matriz combinada y las tablas legacy.", confirm: "BORRAR HABILITACIONES", variant: "destructive", scope: "campus" },
  { id: "projects", label: "Borrar proyectos / electivas / optativas", detail: "Elimina los proyectos y sus participantes.", confirm: "BORRAR PROYECTOS", variant: "destructive", scope: "campus" },
  { id: "courses", label: "Borrar todos los cursos", detail: "Elimina cursos y todo lo que cuelga de ellos.", confirm: "BORRAR CURSOS", variant: "destructive", scope: "campus" },
  { id: "teachers", label: "Borrar todos los docentes", detail: "Elimina docentes y todo lo asociado (asignaciones, matriz, disponibilidad).", confirm: "BORRAR DOCENTES", variant: "destructive", scope: "campus" },
  { id: "subjects", label: "Borrar todas las materias", detail: "Elimina materias y sus referencias en requisitos y asignaciones.", confirm: "BORRAR MATERIAS", variant: "destructive", scope: "campus" },
  { id: "reset_campus", label: "Reiniciar datos de la sede actual", detail: "Borra horarios, proyectos, docentes, cursos y materias de esta sede.", confirm: "REINICIAR SEDE", variant: "danger", scope: "campus" },
  { id: "reset_all", label: "Reiniciar TODO el sistema", detail: "Borra datos operativos de todas las sedes. Conserva usuarios, sedes y bloques horarios.", confirm: "BORRAR TODO", variant: "danger", scope: "global" }
];

export function TestToolsClient({
  currentCampusId,
  campuses
}: {
  currentCampusId: string;
  campuses: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [campusId, setCampusId] = useState<string>(currentCampusId);
  const [busy, setBusy] = useState<Action | null>(null);
  const [confirmFor, setConfirmFor] = useState<Action | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const pending = confirmFor ? ACTIONS.find((a) => a.id === confirmFor)! : null;
  const hasCampus = campuses.length > 0 && Boolean(campusId);

  async function run(action: Action) {
    if (!pending || pending.id !== action) return;
    if (pending.scope === "campus" && !hasCampus) {
      setStatus({ kind: "error", text: "No hay una sede disponible para esta accion." });
      return;
    }
    if (confirmText.trim().toUpperCase() !== pending.confirm) {
      setStatus({ kind: "error", text: `Escribí exactamente: ${pending.confirm}` });
      return;
    }
    setBusy(action);
    setStatus(null);
    try {
      const res = await fetch("/api/test-tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          confirm: confirmText,
          campusId: pending.scope === "campus" ? campusId : undefined
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: "error", text: data.message ?? "No se pudo completar la acción." });
        return;
      }
      setStatus({ kind: "ok", text: data.deleted != null ? `Listo · ${data.deleted} registros eliminados.` : "Listo." });
      setConfirmFor(null);
      setConfirmText("");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-amber-400/60 bg-amber-50/50 dark:bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5" /> Zona de pruebas — sólo SUPERADMIN
          </CardTitle>
          <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
            Estas acciones modifican datos operativos y no se pueden deshacer.
            Las acciones por sede afectan únicamente la sede seleccionada abajo.
          </p>
        </CardHeader>
        <CardContent>
          <label className="grid max-w-md gap-1 text-sm">
            <span className="text-muted-foreground">Sede activa para las acciones por sede</span>
            <select
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          {!hasCampus && (
            <p className="mt-3 rounded-xl border border-rose-300 bg-rose-500/10 p-3 text-sm text-rose-800">
              No hay sedes disponibles. Las herramientas por sede quedan deshabilitadas.
            </p>
          )}
        </CardContent>
      </Card>

      {status && (
        <div className={cn(
          "flex items-center gap-2 rounded-2xl border p-3 text-sm",
          status.kind === "ok" ? "border-emerald-300 bg-emerald-500/10 text-emerald-800" : "border-rose-300 bg-rose-500/10 text-rose-800"
        )}>
          {status.kind === "ok" ? <Trash2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {status.text}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {ACTIONS.map((a) => {
          const open = confirmFor === a.id;
          return (
            <Card key={a.id} className={cn(a.variant === "danger" && "border-rose-300")}>
              <CardHeader>
                <CardTitle className={cn("text-base", a.variant === "danger" && "text-rose-700")}>{a.label}</CardTitle>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {!open ? (
                  <Button
                    variant={a.variant === "danger" ? "destructive" : "secondary"}
                    size="sm"
                    onClick={() => { setConfirmFor(a.id); setConfirmText(""); setStatus(null); }}
                  >
                    <Trash2 className="h-4 w-4" /> {a.label}
                  </Button>
                ) : (
                  <div className="space-y-2 rounded-xl border border-rose-300 bg-rose-50/50 p-3 dark:bg-rose-500/5">
                    <p className="text-xs text-rose-800">
                      Esta acción no se puede deshacer. Para confirmar escribí: <code className="font-mono font-semibold">{a.confirm}</code>
                    </p>
                    <Input
                      autoFocus
                      placeholder={a.confirm}
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="font-mono uppercase"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setConfirmFor(null); setConfirmText(""); }}>Cancelar</Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => run(a.id)}
                        disabled={busy === a.id || confirmText.trim().toUpperCase() !== a.confirm || (a.scope === "campus" && !hasCampus)}
                      >
                        {busy === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
