import { getSessionUser, type SessionUser } from "@/lib/auth";
import {
  classrooms,
  conflicts,
  courseSubjects,
  courses,
  customConditions,
  defaultCampusId,
  importBatches,
  insights,
  programBlocks,
  scheduleEntries,
  subjects,
  teachers
} from "@/lib/demo-data";
import { getDefaultCampusId, getScopedCampusIds, scopedCampuses } from "@/lib/access-control";

export async function getScopedDemoContext() {
  const user =
    (await getSessionUser()) ??
    ({
      id: "anonymous-demo",
      email: "demo@horaria.local",
      name: "Demo",
      role: "SUPERADMIN",
      status: "ACTIVE",
      selectedCampusId: defaultCampusId,
      campusIds: []
    } satisfies SessionUser);
  const scopedCampusIds = getScopedCampusIds(user);
  const selectedCampusId = getDefaultCampusId(user) ?? defaultCampusId;
  const scopedCampusSet = new Set(scopedCampusIds);

  return {
    user,
    selectedCampusId,
    campusIds: scopedCampusIds,
    campuses: scopedCampuses(user),
    isSuperadmin: user.role === "SUPERADMIN",
    teachers: teachers.filter((teacher) => scopedCampusSet.has(teacher.campusId)),
    courses: courses.filter((course) => scopedCampusSet.has(course.campusId)),
    subjects: subjects.filter((subject) => subject.campusId === null || scopedCampusSet.has(subject.campusId)),
    courseSubjects: courseSubjects.filter((item) => scopedCampusSet.has(item.campusId)),
    classrooms: classrooms.filter((room) => scopedCampusSet.has(room.campusId)),
    programBlocks: programBlocks.filter((block) => scopedCampusSet.has(block.campusId)),
    importBatches: importBatches.filter((batch) => scopedCampusSet.has(batch.campusId)),
    scheduleEntries: scheduleEntries.filter((entry) => scopedCampusSet.has(entry.campusId)),
    customConditions: customConditions.filter((condition) => scopedCampusSet.has(condition.campusId)),
    conflicts: conflicts.filter((conflict) => scopedCampusSet.has(conflict.campusId)),
    insights:
      user.role === "SUPERADMIN"
        ? insights
        : insights.filter((insight) => {
            if (selectedCampusId === "campus-nordelta") {
              return !insight.includes("Puertos") && !insight.includes("sede Puertos");
            }
            return !insight.includes("Nordelta");
          })
  };
}
