import { Bell, Building2, Gauge, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const sections = [
    [Building2, "Perfil institucional", "Datos de la sede, identidad visual y estructura académica para organizar el año escolar."],
    [Shield, "Acceso y roles", "Permisos de edición, sedes asignadas e invitaciones para cada integrante del equipo."],
    [Gauge, "Motor de horarios", "Prioridades, tolerancias y tiempo máximo para generar horarios de forma controlada."],
    [Bell, "Alertas y seguimiento", "Avisos cuando una generación falla, queda parcial o una edición manual crea conflictos."]
  ] as const;

  return (
    <AppShell title="Configuración" subtitle="Identidad institucional, acceso y parámetros del motor de horarios.">
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2 xl:grid-cols-4 lg:p-8">
        {sections.map(([Icon, title, text]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-emerald-600" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{text}</p>
              <Badge className="mt-4">Configurable</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
