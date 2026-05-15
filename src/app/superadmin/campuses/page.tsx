import { Building2, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { campuses } from "@/lib/demo-data";

export default function CampusesPage() {
  return (
    <AppShell title="Sedes" subtitle="Crear, editar o desactivar campus de la institucion.">
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Campuses</CardTitle>
            <Button size="sm"><Plus className="h-4 w-4" /> Nueva sede</Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {campuses.map((campus) => (
              <div key={campus.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-bold"><Building2 className="h-4 w-4 text-orange-600" /> {campus.name}</h3>
                  <Badge>{campus.code}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{campus.address}, {campus.city}, {campus.province}</p>
                <Badge className="mt-4 bg-green-500/10 text-green-700">{campus.isActive ? "Activa" : "Inactiva"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
