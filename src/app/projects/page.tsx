import { Clock, Plus, Users, Workflow } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { programBlocks } from "@/lib/demo-data";

export default function ProjectsPage() {
  return (
    <AppShell title="Proyectos, electivas y optativas" subtitle="Coordina bloques especiales con docentes y cursos simultaneos.">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <Button>
            <Plus className="h-4 w-4" />
            Crear proyecto/electiva
          </Button>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {programBlocks.map((block) => (
            <Card key={block.id} className={block.priority === "CRITICAL" ? "border-orange-300" : ""}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-orange-600" />
                    {block.name}
                  </CardTitle>
                  <Badge>{block.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{block.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border p-3">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> Docentes requeridos</p>
                    <div className="flex flex-wrap gap-2">
                      {block.requiredTeachers.map((teacher) => <Badge key={`${block.id}-teacher-${teacher}`}>{teacher}</Badge>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="mb-2 text-sm font-semibold">Cursos involucrados</p>
                    <div className="flex flex-wrap gap-2">
                      {block.involvedCourses.map((course) => <Badge key={`${block.id}-course-${course}`}>{course}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-secondary p-3 text-sm">Aula: {block.preferredClassroom}</div>
                  <div className="rounded-xl bg-secondary p-3 text-sm">Tipo: {block.requiredRoomType}</div>
                  <div className="rounded-xl bg-secondary p-3 text-sm">{block.weeklyModules} modulos</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {block.requiresSameTimeTeachers && <Badge className="bg-orange-500/10 text-orange-700">Docentes simultaneos</Badge>}
                  {block.requiresSameTimeCourses && <Badge className="bg-green-500/10 text-green-700">Cursos simultaneos</Badge>}
                  {block.fixedDay !== null && <Badge><Clock className="mr-1 h-3 w-3" /> Fijo: {block.fixedDay}/{block.fixedTimeSlot}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{block.notes}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
