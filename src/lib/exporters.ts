import { getLatestScheduleForCampus, type ScheduleAssignmentRow } from "@/lib/scheduler";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

export type ExportFilter = {
  campusId: string;
  filterType?: "all" | "course" | "teacher" | "subject";
  filterId?: string | null;
};

export function getFilteredAssignments({ campusId, filterType, filterId }: ExportFilter): ScheduleAssignmentRow[] {
  const all = getLatestScheduleForCampus(campusId);
  if (!filterType || filterType === "all" || !filterId) return all;
  if (filterType === "course") return all.filter((row) => row.course_id === filterId);
  if (filterType === "teacher") return all.filter((row) => row.teacher_id === filterId);
  if (filterType === "subject") return all.filter((row) => row.subject_id === filterId);
  return all;
}

export function buildScheduleCsv(entries: ScheduleAssignmentRow[]) {
  const rows = [
    ["Día", "Bloque", "Inicio", "Fin", "Curso", "Materia", "Docente"],
    ...entries.map((e) => [
      DAYS[e.day_of_week] ?? String(e.day_of_week),
      String(e.block_index),
      e.start_time,
      e.end_time,
      e.course_name ?? "",
      e.subject_name ?? "",
      e.teacher_name ?? ""
    ])
  ];
  return rows.map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}
