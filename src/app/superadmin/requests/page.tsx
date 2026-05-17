import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function RequestsPage() {
  return (
    <AppShell title="Solicitudes de registro" subtitle="El registro ahora usa códigos de invitación.">
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">No hay solicitudes pendientes.</p>
            <p className="mt-2">
              Las cuentas se crean directamente al canjear un código de invitación. Para flujos con aprobación manual,
              creá el código con la opción <strong>Requiere aprobación</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
