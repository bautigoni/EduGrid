import { BookMarked, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseSubjects, subjects } from "@/lib/demo-data";

export default function SubjectsPage() {
  return (
    <AppShell title="Subjects" subtitle="Assign required subjects, weekly loads, and distribution preferences.">
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subject assignment matrix</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add subject
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3">Subject</th>
                  <th>Code</th>
                  <th>Room type</th>
                  <th>Assigned weekly modules</th>
                  <th>Courses</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const assigned = courseSubjects.filter((item) => item.subject === subject.name);
                  return (
                    <tr key={subject.id} className="border-b last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                          <span className="font-semibold">{subject.name}</span>
                        </div>
                      </td>
                      <td>
                        <Badge>{subject.code}</Badge>
                      </td>
                      <td>{subject.roomType.replace("_", " ")}</td>
                      <td>{assigned.reduce((sum, item) => sum + item.weeklyModules, 0)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          {assigned.map((item) => (
                            <Badge key={item.course} className="bg-secondary">
                              {item.course}: {item.distribution}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
