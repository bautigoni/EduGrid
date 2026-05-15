import { RotateCcw, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { campuses, demoUsers } from "@/lib/demo-data";

export default function UsersPage() {
  return (
    <AppShell title="Usuarios" subtitle="Administra roles, sedes, suspensiones y reactivaciones.">
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Users management</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3">Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Sede</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {demoUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-4 font-semibold">{user.name}</td>
                    <td>{user.email}</td>
                    <td><Badge>{user.role}</Badge></td>
                    <td><Badge>{user.status}</Badge></td>
                    <td>{campuses.find((campus) => campus.id === user.selectedCampusId)?.name ?? "Sin sede"}</td>
                    <td>{user.createdAt}</td>
                    <td className="space-x-2">
                      <Button size="sm" variant="secondary"><ShieldAlert className="h-4 w-4" /> Suspender</Button>
                      <Button size="sm" variant="outline"><RotateCcw className="h-4 w-4" /> Reactivar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
