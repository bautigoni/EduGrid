import { AlertTriangle, CalendarCheck, DoorOpen, GraduationCap, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { GenerationPanel } from "@/components/scheduler/generation-panel";
import { ScheduleCalendar } from "@/components/scheduler/schedule-calendar";
import { classrooms, courses, scheduleEntries, teachers } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" subtitle="Monitor scheduling readiness, conflicts, and optimization health.">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Teachers" value={teachers.length.toString()} detail="5 with availability rules" icon={Users} tone="bg-teal-500" />
          <StatCard label="Courses" value={courses.length.toString()} detail="1st and 2nd year divisions" icon={GraduationCap} tone="bg-sky-500" />
          <StatCard label="Classrooms" value={classrooms.length.toString()} detail="Rooms typed by compatibility" icon={DoorOpen} tone="bg-violet-500" />
          <StatCard label="Assigned" value={scheduleEntries.length.toString()} detail="Modules in active version" icon={CalendarCheck} tone="bg-emerald-500" />
          <StatCard label="Conflicts" value="0" detail="Hard constraints passing" icon={AlertTriangle} tone="bg-amber-500" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <GenerationPanel />
            <ScheduleCalendar />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <InsightPanel />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
