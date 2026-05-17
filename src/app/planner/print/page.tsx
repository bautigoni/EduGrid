import { getCampusById } from "@/server/repositories/campuses";
import { getTimeBlocksForCampus } from "@/server/repositories/timeBlocks";
import { getFilteredAssignments } from "@/lib/exporters";
import { getTeachersByCampus } from "@/server/repositories/teachers";
import { getCoursesByCampus } from "@/server/repositories/courses";
import { getSubjectsByCampus } from "@/server/repositories/subjects";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

type SearchParams = Promise<{ campusId?: string; filterType?: string; filterId?: string }>;

const breakStyles: Record<string, { bg: string; fg: string; label: string }> = {
  BREAK: { bg: "#FEF3C7", fg: "#92400E", label: "Recreo" },
  MINI_BREAK: { bg: "#FEF3C7", fg: "#92400E", label: "Mini break" },
  LUNCH: { bg: "#FFEDD5", fg: "#9A3412", label: "Comida y recreo" }
};

export default async function PlannerPrintPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const campusId = params.campusId ?? "";
  const filterType = (params.filterType as "all" | "course" | "teacher" | "subject" | undefined) ?? "all";
  const filterId = params.filterId || null;
  if (!campusId) return <main className="p-10">Falta la sede.</main>;

  const campus = getCampusById(campusId);
  const blocks = getTimeBlocksForCampus(campusId);
  let entries = getFilteredAssignments({ campusId, filterType, filterId });
  // Institutional hours only make sense in the teacher view. Everywhere else they are filler.
  if (filterType !== "teacher") {
    entries = entries.filter((e) => e.assignment_type !== "INSTITUTIONAL_HOUR");
  }

  let filterLabel = "Horario completo";
  if (filterType === "course" && filterId) {
    const course = getCoursesByCampus(campusId).find((c) => c.id === filterId);
    filterLabel = `Curso: ${course?.name ?? filterId}`;
  } else if (filterType === "teacher" && filterId) {
    const teacher = getTeachersByCampus(campusId).find((t) => t.id === filterId);
    filterLabel = `Docente: ${teacher?.full_name ?? filterId}`;
  } else if (filterType === "subject" && filterId) {
    const subject = getSubjectsByCampus(campusId).find((s) => s.id === filterId);
    filterLabel = `Materia: ${subject?.name ?? filterId}`;
  }

  // Group blocks by row signature (start_time | end_time | type)
  const rowsMap = new Map<string, { type: string; label: string; start_time: string; end_time: string }>();
  for (const b of blocks) {
    const key = `${b.start_time}|${b.end_time}|${b.type}`;
    if (!rowsMap.has(key)) {
      rowsMap.set(key, { type: b.type, label: b.label, start_time: b.start_time, end_time: b.end_time });
    }
  }
  const rows = [...rowsMap.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const byCell = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = `${entry.day_of_week}|${entry.time_block_id}`;
    if (!byCell.has(key)) byCell.set(key, [] as never);
    byCell.get(key)!.push(entry);
  }

  return (
    <main className="bg-white p-8 text-slate-900 print:p-4">
      <style>{`
        @page { size: landscape; margin: 12mm; }
        @media print { .no-print { display: none !important; } body { background: white; } }
        .schedule-cell { border: 1px solid #e5e7eb; vertical-align: top; padding: 6px; min-width: 110px; }
        .schedule-row-break td { font-style: italic; }
      `}</style>

      <header className="mb-6 flex items-center justify-between border-b-2 border-orange-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Horaria · {campus?.name ?? "Sede"}</h1>
          <p className="text-sm text-slate-600">{filterLabel}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>Generado: {new Date().toLocaleString("es-AR")}</div>
          <div>{entries.length} bloques asignados</div>
        </div>
      </header>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="schedule-cell bg-slate-100 text-left">Bloque</th>
            {DAYS.map((day) => (
              <th key={day} className="schedule-cell bg-slate-100 text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isBreak = row.type !== "CLASS";
            if (isBreak) {
              const style = breakStyles[row.type] ?? breakStyles.BREAK;
              return (
                <tr key={row.key} className="schedule-row-break">
                  <td className="schedule-cell font-medium" style={{ backgroundColor: style.bg, color: style.fg }}>
                    {row.label}
                  </td>
                  <td className="schedule-cell text-center" colSpan={5} style={{ backgroundColor: style.bg, color: style.fg }}>
                    {style.label}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={row.key}>
                <td className="schedule-cell font-medium">
                  <div>{row.label}</div>
                  <div className="text-[10px] text-slate-500">{row.start_time} - {row.end_time}</div>
                </td>
                {DAYS.map((_, dayIdx) => {
                  const blockId = blocks.find(
                    (b) => b.day_of_week === dayIdx && b.start_time === row.start_time && b.end_time === row.end_time
                  )?.id;
                  if (!blockId) return <td key={dayIdx} className="schedule-cell" />;
                  const cellEntries = byCell.get(`${dayIdx}|${blockId}`) ?? [];
                  return (
                    <td key={dayIdx} className="schedule-cell">
                      {cellEntries.length === 0 ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        cellEntries.map((e) => {
                          if (e.assignment_type === "INSTITUTIONAL_HOUR") {
                            return (
                              <div key={e.id} className="mb-1 rounded-md border border-dashed border-slate-400 bg-slate-50 px-2 py-1 italic text-slate-600">
                                Hora institucional
                              </div>
                            );
                          }
                          const isProject = e.assignment_type !== "REGULAR_CLASS";
                          const color = e.subject_color ?? "#a78bfa";
                          return (
                            <div
                              key={e.id}
                              className="mb-1 rounded-md border px-2 py-1"
                              style={{ borderColor: color, backgroundColor: `${color}26` }}
                            >
                              <div className="font-semibold">{e.subject_name ?? e.title ?? "—"}</div>
                              <div className="text-[10px] text-slate-700">
                                {[e.course_name, e.teacher_name].filter(Boolean).join(" · ")}
                              </div>
                              {isProject && (
                                <div className="mt-0.5 inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-orange-900">
                                  {e.assignment_type.replace("_", " ")}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="no-print mt-6 flex justify-end">
        <PrintButton />
      </div>
    </main>
  );
}
