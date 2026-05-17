import { buildScheduleCsv, getFilteredAssignments } from "@/lib/exporters";
import { getDefaultCampusId, jsonError, requireAuth, requireCampusAccess } from "@/lib/access-control";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const campusId = url.searchParams.get("campusId") ?? getDefaultCampusId(user);
    if (!campusId) return new Response("No campus", { status: 400 });
    requireCampusAccess(user, campusId);
    const filterType = (url.searchParams.get("filterType") as "all" | "course" | "teacher" | "subject" | null) ?? "all";
    const filterId = url.searchParams.get("filterId");
    let entries = getFilteredAssignments({ campusId, filterType, filterId });
    if (filterType !== "teacher") {
      entries = entries.filter((e) => e.assignment_type !== "INSTITUTIONAL_HOUR");
    }
    return new Response(buildScheduleCsv(entries), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="horaria-${filterType}-${filterId ?? "todo"}.csv"`
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
