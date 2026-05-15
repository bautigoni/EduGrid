import { buildSchedulePdf } from "@/lib/exporters";
import { jsonError, requireAuth, resolveCampusScope } from "@/lib/access-control";
import { scheduleEntries } from "@/lib/demo-data";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const campusIds = resolveCampusScope(user, new URL(request.url).searchParams.get("campusId"));
    const scopedEntries = scheduleEntries.filter((entry) => campusIds.includes(entry.campusId));
    return new Response(buildSchedulePdf(scopedEntries), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="horaria-schedule.pdf"'
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
