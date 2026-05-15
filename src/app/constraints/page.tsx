import { AlertTriangle, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScopedDemoContext } from "@/lib/demo-scope";

const hard = [
  "Evitar cruces docentes",
  "Evitar choques de aula",
  "Un curso por bloque horario",
  "Respetar disponibilidad docente",
  "Respetar tipo de aula requerido",
  "Cumplir carga semanal"
];

const soft = [
  "Minimizar huecos",
  "Balancear carga diaria",
  "Evitar clases aisladas",
  "Agrupar bloques horarios consecutivos",
  "Reducir distribuciones ineficientes"
];

export default async function ConstraintsPage() {
  const data = await getScopedDemoContext();
  const conflict = data.conflicts[0];

  return (
    <AppShell title="Restricciones" subtitle="Ajustá el perfil que alimenta el optimizador CP-SAT.">
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <Card className="min-w-0">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Semana académica balanceada</CardTitle>
            <Button size="sm" variant="secondary">
              <SlidersHorizontal className="h-4 w-4" />
              Editar perfil
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <Badge className="mb-4 border-emerald-300 bg-emerald-500/10 text-emerald-600">Restricciones duras</Badge>
              <div className="space-y-3">
                {hard.map((item) => <div key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" />{item}</div>)}
              </div>
            </div>
            <div className="rounded-2xl border p-4">
              <Badge className="mb-4 border-sky-300 bg-sky-500/10 text-sky-600">Preferencias</Badge>
              <div className="space-y-3">
                {soft.map((item) => <div key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" />{item}</div>)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass min-w-0">
          <CardHeader>
            <CardTitle>Análisis de conflictos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Disponibilidad docente", data.conflicts.length.toString(), "Bloques que no encuentran disponibilidad común."],
              ["Aulas compatibles", "1", "Validación de aula y capacidad."],
              ["Carga semanal", "0", "La carga requerida entra en la grilla."]
            ].map(([label, count, text]) => (
              <div key={label} className="rounded-2xl border bg-background/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{label}</span>
                  <Badge>{count}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
            {conflict && (
              <div className="rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mb-2 h-4 w-4" />
                {conflict.messageEs} Sugerencia: {conflict.suggestionsEs[0]}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Condiciones personalizadas</CardTitle>
            <p className="text-sm text-muted-foreground">Reglas de carga, preferencias y restricciones por entidad.</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {data.customConditions.map((condition) => (
              <div key={condition.id} className="rounded-2xl border p-4">
                <Badge className={condition.isHardConstraint ? "bg-orange-500/10 text-orange-700" : "bg-green-500/10 text-green-700"}>
                  {condition.isHardConstraint ? "Dura" : "Blanda"} - {condition.priority}
                </Badge>
                <h3 className="mt-3 font-semibold">{condition.conditionType}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{condition.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
