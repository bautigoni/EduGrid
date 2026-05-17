import { jsonError, requireAuth } from "@/lib/access-control";

const templates = {
  teacherAvailability: [
    "Teacher name,Email,Day,Start time,End time,Availability status,Campus,Notes",
    "Ana Perez,ana.perez@example.org,Lunes,08:15,09:15,Disponible,Sede Principal,Manana"
  ].join("\n"),
  courseSchedule: [
    "Course,Division,Classroom,Subject,Teacher,Day,Start time,End time,Campus",
    "1,A,Aula 1A,Matematica,Ana Perez,Lunes,08:15,09:15,Sede Principal"
  ].join("\n"),
  classroomSchedule: [
    "Classroom,Day,Start time,End time,Course,Subject,Teacher,Campus",
    "Sala de Informatica,Jueves,09:15,10:15,2N,Tecnologia,Mariana Lopez,Sede Principal"
  ].join("\n")
};

export async function GET(request: Request) {
  try {
    await requireAuth();
    const type = (new URL(request.url).searchParams.get("type") ?? "teacherAvailability") as keyof typeof templates;
    const content = templates[type] ?? templates.teacherAvailability;
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
