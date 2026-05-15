import Link from "next/link";
import { Building2, CalendarCheck, ShieldCheck, UserCheck, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { campuses, demoUsers, registrationRequests, scheduleEntries } from "@/lib/demo-data";

export default function SuperadminPage() {
  return (
    <AppShell title="Superadmin" subtitle="Control global de sedes, usuarios, solicitudes y horarios.">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Sedes" value={campuses.length.toString()} detail="Activas en la institucion" icon={Building2} tone="bg-orange-500" />
          <StatCard label="Solicitudes pendientes" value={registrationRequests.length.toString()} detail="Requieren aprobacion" icon={UserCheck} tone="bg-amber-500" />
          <StatCard label="Usuarios activos" value={demoUsers.filter((user) => user.status === "ACTIVE").length.toString()} detail="Con roles asignados" icon={Users} tone="bg-green-500" />
          <StatCard label="Horarios generados" value={scheduleEntries.length.toString()} detail="Version demo multisede" icon={CalendarCheck} tone="bg-sky-500" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Pablo Leon solicito acceso como planificador para Puertos.",
              "Se importo Horarios cursos en Puertos sin errores.",
              "Ciudadanos genero conflicto por disponibilidad comun.",
              "Se creo el bloque Electiva de Tecnologia."
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border p-4">
                <span className="text-sm">{item}</span>
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href="/superadmin/requests">Gestionar solicitudes</Link></Button>
          <Button asChild variant="secondary"><Link href="/superadmin/campuses">Gestionar sedes</Link></Button>
          <Button asChild variant="secondary"><Link href="/superadmin/users">Gestionar usuarios</Link></Button>
        </div>
      </div>
    </AppShell>
  );
}
