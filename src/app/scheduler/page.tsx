import Link from "next/link";
import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GenerationPanel } from "@/components/scheduler/generation-panel";
import { ScheduleCalendar } from "@/components/scheduler/schedule-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulerPage() {
  return (
    <AppShell title="Scheduler" subtitle="Generate, inspect, manually adjust, and export timetable versions.">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <GenerationPanel />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Version: Trimester 1</CardTitle>
              <div className="flex gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/api/export/pdf">
                    <FileDown className="h-4 w-4" />
                    PDF
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/api/export/excel">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Link>
                </Button>
                <Button variant="secondary" size="sm">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {["Teacher schedule", "Course schedule", "Classroom schedule"].map((view) => (
                  <button key={view} className="rounded-2xl border bg-secondary px-4 py-3 text-sm font-semibold hover:bg-secondary/70">
                    {view}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <ScheduleCalendar />
      </div>
    </AppShell>
  );
}
