"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export default function TestToolsError({ reset }: { reset: () => void }) {
  return (
    <AppShell title="Herramientas de prueba" subtitle="Acciones destructivas para limpiar datos mientras se prueba.">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-rose-300 bg-rose-500/10 p-4 text-sm text-rose-800">
          <p className="font-semibold">No se pudieron cargar las herramientas de prueba.</p>
          <p className="mt-1">La página falló de forma recuperable. Podés volver a intentar sin reiniciar la app.</p>
          <Button className="mt-3" variant="secondary" onClick={reset}>Reintentar</Button>
        </div>
      </div>
    </AppShell>
  );
}
