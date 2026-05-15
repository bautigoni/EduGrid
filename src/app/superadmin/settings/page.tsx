import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperadminSettingsPage() {
  return (
    <AppShell title="Configuracion Superadmin" subtitle="Politicas globales de aprobacion, OAuth y sedes.">
      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3 lg:p-8">
        {["Google OAuth", "Aprobacion automatica", "Reglas multisede"].map((item) => (
          <Card key={item}>
            <CardHeader><CardTitle>{item}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Configuracion lista para conectar a produccion.</p></CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
