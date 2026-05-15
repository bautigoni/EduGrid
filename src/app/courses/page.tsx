import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseSubjects, courses } from "@/lib/demo-data";

export default function CoursesPage() {
  return (
    <AppShell title="Cursos" subtitle="Creá años, divisiones y requisitos semanales por materia.">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <Button>
            <Plus className="h-4 w-4" />
            New course
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.label}</CardTitle>
                <p className="text-sm text-muted-foreground">Year {course.year} - Division {course.division}</p>
              </CardHeader>
              <CardContent>
                <Badge>{course.studentCount} students</Badge>
                <div className="mt-4 space-y-2">
                  {courseSubjects
                    .filter((item) => item.course === course.label)
                    .map((item) => (
                      <div key={`${course.id}-${item.campusId}-${item.course}-${item.subject}-${item.weeklyModules}`} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
                        <span>{item.subject}</span>
                        <span className="font-semibold">{item.weeklyModules} modules</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
