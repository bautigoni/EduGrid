import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type UserRow = { id: string; full_name: string; email: string; role: string; status: string; created_at: string };

export default function UsersPage() {
  const users = getDb().prepare("SELECT id, full_name, email, role, status, created_at FROM users ORDER BY created_at DESC").all() as UserRow[];
  return (
    <AppShell title="Usuarios" subtitle="Gestioná cuentas, roles y estado de acceso.">
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {users.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No hay usuarios todavía. Ejecutá <code>npm run db:seed:clean</code>.</p>
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3">Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-4 font-semibold">{user.full_name}</td>
                      <td>{user.email}</td>
                      <td><Badge>{user.role}</Badge></td>
                      <td><Badge>{user.status}</Badge></td>
                      <td>{new Date(user.created_at).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
