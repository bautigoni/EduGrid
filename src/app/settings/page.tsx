import { Bell, Database, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Configure school identity, roles, integrations, and optimizer defaults.">
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-3 lg:p-8">
        {[
          [Shield, "Access control", "Admins can generate schedules. Coordinators can edit constraints. Viewers can export."],
          [Database, "Data source", "PostgreSQL with Prisma migrations and deterministic school demo seed."],
          [Bell, "Notifications", "Alert admins when a schedule version fails or a manual edit creates conflicts."]
        ].map(([Icon, title, text]) => (
          <Card key={title as string}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                {title as string}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{text as string}</p>
              <Badge className="mt-4">Production setting</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
