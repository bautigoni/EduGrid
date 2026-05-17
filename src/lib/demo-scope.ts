import { getSessionUser, type SessionUser } from "@/lib/auth";
import { getCampusesForUser } from "@/server/repositories/campuses";
import { getTeachersByCampus } from "@/server/repositories/teachers";
import { getCoursesByCampus } from "@/server/repositories/courses";
import { getSubjectsByCampus } from "@/server/repositories/subjects";
import { getTimeBlocksForCampus, getAssignableBlocksForCampus } from "@/server/repositories/timeBlocks";

/**
 * Scoped server-side context for the current request.
 * - Superadmins get every active campus.
 * - Coordinators only see campuses they are assigned to.
 * - The "selected campus" is honoured via a cookie when present.
 */
export async function getScopedDemoContext() {
  const session: SessionUser | null = await getSessionUser();
  const user = session ?? {
    id: "anonymous",
    email: "anonymous@horaria.local",
    name: "Invitado",
    role: "COORDINADOR_HORARIOS" as const,
    status: "ACTIVE" as const,
    selectedCampusId: null,
    campusIds: []
  };

  const campuses = getCampusesForUser({ id: user.id, role: user.role });
  const selectedCampusId =
    (user.selectedCampusId && campuses.find((c) => c.id === user.selectedCampusId)?.id) || campuses[0]?.id || "";

  const teachers = selectedCampusId ? getTeachersByCampus(selectedCampusId) : [];
  const courses = selectedCampusId ? getCoursesByCampus(selectedCampusId) : [];
  const subjects = selectedCampusId ? getSubjectsByCampus(selectedCampusId) : [];
  const timeBlocks = selectedCampusId ? getTimeBlocksForCampus(selectedCampusId) : [];
  const assignableBlocks = selectedCampusId ? getAssignableBlocksForCampus(selectedCampusId) : [];

  return {
    user,
    selectedCampusId,
    campusIds: campuses.map((c) => c.id),
    campuses,
    isSuperadmin: user.role === "SUPERADMIN",
    teachers,
    courses,
    subjects,
    courseSubjects: [] as Array<{ campusId: string; course: string; subject: string; weeklyBlocksRequired: number; distribution: string }>,
    classrooms: [] as Array<{ id: string; campusId: string; name: string; type: string; capacity: number; restrictions: string | null }>,
    programBlocks: [] as Array<unknown>,
    importBatches: [] as Array<{ id: string; campusId: string; type: string; status: string; filename: string; rows: number; validRows: number; errors: number; createdAt: string }>,
    scheduleEntries: [] as Array<unknown>,
    customConditions: [] as Array<unknown>,
    conflicts: [] as Array<unknown>,
    insights: [] as string[],
    timeBlocks,
    assignableBlocks
  };
}
