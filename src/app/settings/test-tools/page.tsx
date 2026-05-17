import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TestToolsClient } from "@/components/settings/test-tools-client";
import { getSessionUser } from "@/lib/auth";
import { getScopedDemoContext } from "@/lib/demo-scope";

export const dynamic = "force-dynamic";

export default async function TestToolsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/");
  try {
    const data = await getScopedDemoContext();
    return (
      <AppShell title="Herramientas de prueba" subtitle="Acciones destructivas para limpiar datos mientras se prueba.">
        <div className="p-4 sm:p-6 lg:p-8">
          <TestToolsClient
            currentCampusId={data.selectedCampusId ?? data.campuses[0]?.id ?? ""}
            campuses={data.campuses.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      </AppShell>
    );
  } catch (error) {
    console.error("[test-tools] render failed", error);
  }
  return (
    <AppShell title="Herramientas de prueba" subtitle="Acciones destructivas para limpiar datos mientras se prueba.">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-rose-300 bg-rose-500/10 p-4 text-sm text-rose-800">
          <p className="font-semibold">No se pudieron cargar las herramientas de prueba.</p>
          <p className="mt-1">Volvé a intentar o revisá la sesión de superadmin. La app sigue funcionando.</p>
        </div>
      </div>
    </AppShell>
  );
}
