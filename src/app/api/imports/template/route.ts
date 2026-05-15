import { importTemplates } from "@/lib/demo-data";
import { jsonError, requireAuth } from "@/lib/access-control";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "teacherAvailability";
    const content =
      type === "courseSchedule"
        ? importTemplates.courseSchedule
        : type === "classroomSchedule"
          ? importTemplates.classroomSchedule
          : importTemplates.teacherAvailability;

    return new Response(content, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${type}_template.csv"`
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
