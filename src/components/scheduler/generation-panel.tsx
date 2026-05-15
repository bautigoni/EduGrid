"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GenerationPanel({ campusId }: { campusId: string }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ entries?: unknown[]; note?: string; conflicts?: { message: string; suggestions: string[] }[] } | null>(null);

  async function generate() {
    setStatus("running");
    setResult(null);
    setProgress(18);
    const steps = [38, 57, 76, 91];
    steps.forEach((value, index) => {
      window.setTimeout(() => setProgress(value), 450 * (index + 1));
    });

    const response = await fetch("/api/scheduler/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ campusId })
    });
    const data = await response.json();
    window.setTimeout(() => {
      setProgress(100);
      setResult(data);
      setStatus(data.status === "SUCCESS" ? "done" : "failed");
    }, 2200);
  }

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Motor de restricciones</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Optimización CP-SAT con restricciones duras y blandas.</p>
        </div>
        <Badge className="border-primary/30 bg-primary/10 text-primary">OR-Tools listo</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button size="lg" className="w-full" onClick={generate} disabled={status === "running"}>
          {status === "running" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          Generar horario
        </Button>

        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#27d3bf,#60a5fa)]"
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Docentes cargados",
            "Disponibilidad docente cargada",
            "Cursos cargados",
            "Disponibilidad de cursos cargada",
            "Materias por curso cargadas",
            "Docentes compatibles con materias"
          ].map((label) => (
            <div key={label} className="rounded-2xl border bg-background/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {label}
              </div>
              <p className="text-xs text-muted-foreground">Validado durante la generación.</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Las aulas no son requisito: cada curso usa su aula base. Las salas especiales se controlan solo cuando una materia o proyecto lo exige.
        </p>

        {result && (
          <div className="rounded-2xl border bg-background/70 p-4">
            <div className="flex items-center gap-2 font-semibold">
              {status === "done" ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <AlertTriangle className="h-5 w-5 text-rose-500" />}
              {status === "done" ? "Horario generado" : "La generacion fallo"}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {status === "done"
                ? `${result.entries?.length ?? 0} bloques horarios ubicados. ${result.note ?? "Horario guardado como nueva versión."}`
                : "No hay suficientes bloques compatibles. Probá flexibilizar la disponibilidad de docentes o cursos."}
            </p>
            {Boolean(result.conflicts?.length) && (
              <div className="mt-3 space-y-2">
                {result.conflicts?.map((conflict, index) => (
                  <div key={`generation-conflict-${index}-${conflict.message}`} className="rounded-xl bg-orange-500/10 p-3 text-sm text-orange-800 dark:text-orange-200">
                    <p className="font-semibold">{conflict.message}</p>
                    <p className="mt-1 text-xs">{conflict.suggestions.join(" ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
