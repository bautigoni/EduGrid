import { Plus, UserRoundCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AvailabilityGrid } from "@/components/scheduler/availability-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teachers } from "@/lib/demo-data";

export default function TeachersPage() {
  return (
    <AppShell title="Docentes" subtitle="Gestioná carga, materias, disponibilidad, restricciones y preferencias.">
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_520px] lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Faculty roster</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New teacher
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="rounded-2xl border p-4 transition hover:bg-secondary/50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      <UserRoundCheck className="h-4 w-4 text-primary" />
                      {teacher.fullName}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{teacher.email}</p>
                  </div>
                  <Badge>{teacher.weeklyMaxModules} max modules</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {teacher.subjects.map((subject) => (
                    <Badge key={`${teacher.id}-${subject}`} className="bg-primary/10 text-primary">
                      {subject}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{teacher.preferences}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Visual weekly availability</CardTitle>
            <p className="text-sm text-muted-foreground">Click cells to toggle availability for Ana Martinez.</p>
          </CardHeader>
          <CardContent>
            <AvailabilityGrid />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
