import { getDb, newId, nowIso } from "@/lib/db";

export type Severity = "CRITICAL" | "WARNING" | "INFO";
export type GenerationStatus = "SUCCESS" | "FAILED_ERROR" | "FAILED_TIMEOUT" | "PARTIAL";
export type ScheduleVersionStatus = "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED_TIMEOUT" | "FAILED_ERROR" | "PARTIAL" | "FAILED";

export type TechnicalDiagnostic = {
  course?: string;
  subject?: string;
  candidatesConsidered: number;
  eligibleTeachers: string[];
  validTimeBlocksBeforeConflicts: number;
  rejectedByReason: Record<string, number>;
  freeCourseBlocks?: string[];
  commonAvailableBlocks?: string[];
  blockingAssignments?: string[];
};

export type GenerationConflict = {
  id?: string;
  type: string;
  severity: Severity;
  message: string;
  suggestion?: string;
  entity_type?: string | null;
  entity_id?: string | null;
  technical?: TechnicalDiagnostic;
};

export type ScheduleAssignmentRow = {
  id: string;
  schedule_version_id: string;
  campus_id: string;
  course_id: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  time_block_id: string;
  assignment_type: string;
  title: string | null;
  forced: number;
  day_of_week: number;
  block_index: number;
  start_time: string;
  end_time: string;
  course_name?: string | null;
  subject_name?: string | null;
  subject_color?: string | null;
  teacher_name?: string | null;
};

export type GenerationOptions = {
  dryRun?: boolean;
  maxRuntimeMs?: number;
  maxIterations?: number;
  maxBacktrackingDepth?: number;
  maxCandidateAttemptsPerNeed?: number;
};

export type GenerationResult = {
  status: GenerationStatus;
  userMessage: string;
  entries: ScheduleAssignmentRow[];
  conflicts: GenerationConflict[];
  scheduleVersionId: string | null;
  durationMs: number;
  dryRun: boolean;
  summary: {
    coursesComplete: number;
    coursesWithPending: number;
    pendingBlocks: number;
    freeCourseBlocks: number;
    teachersComplete: number;
    teachersIncomplete: number;
    teachersWithInstitutional: number;
    institutionalHoursGenerated: number;
    critical: number;
    warnings: number;
    iterations: number;
    assignments: number;
  };
  diagnostics: {
    durationMs: number;
    timedOut: boolean;
    iterations: number;
    technical: TechnicalDiagnostic[];
  };
};

type CourseRow = { id: string; name: string; campus_id: string };
type SubjectRow = { id: string; name: string; color: string | null };
type TeacherRow = { id: string; full_name: string; contractual_weekly_minutes: number; allow_institutional_hours: number };
type TimeBlockRow = {
  id: string;
  campus_id: string;
  day_of_week: number;
  block_index: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  block_value: number;
  label: string;
  type: string;
  is_assignable: number;
};
type RequirementRow = {
  course_id: string;
  subject_id: string;
  weekly_blocks_required: number;
  course_name: string;
  subject_name: string;
  subject_color: string | null;
};
type ForcedRow = {
  id: string;
  course_id: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  time_block_id: string;
  assignment_type: string;
  reason: string | null;
  hard_override: number;
};
type ProjectRow = { id: string; name: string; type: string; fixed_time_block_id: string | null; weekly_blocks_required: number; flexible: number };
type Need = { courseId: string; subjectId: string; courseName: string; subjectName: string; subjectColor: string | null; unitIndex: number };
type Candidate = { teacherId: string; blockId: string };
type PlannedAssignment = {
  id: string;
  schedule_version_id: string;
  campus_id: string;
  course_id: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  time_block_id: string;
  assignment_type: string;
  title: string | null;
  forced: number;
  need_index?: number;
};

const PROJECT_COLOR = "#a78bfa";

const DEFAULT_LIMITS = {
  maxRuntimeMs: 10_000,
  maxIterations: 200_000,
  maxBacktrackingDepth: 5,
  maxCandidateAttemptsPerNeed: 80
};

export function generateScheduleForCampus(campusId: string, options: GenerationOptions = {}): GenerationResult {
  const startedAt = Date.now();
  const limits = {
    maxRuntimeMs: typeof options.maxRuntimeMs === "number" ? options.maxRuntimeMs : DEFAULT_LIMITS.maxRuntimeMs,
    maxIterations: typeof options.maxIterations === "number" ? options.maxIterations : DEFAULT_LIMITS.maxIterations,
    maxBacktrackingDepth: typeof options.maxBacktrackingDepth === "number" ? options.maxBacktrackingDepth : DEFAULT_LIMITS.maxBacktrackingDepth,
    maxCandidateAttemptsPerNeed: typeof options.maxCandidateAttemptsPerNeed === "number" ? options.maxCandidateAttemptsPerNeed : DEFAULT_LIMITS.maxCandidateAttemptsPerNeed
  };
  const deadline = startedAt + limits.maxRuntimeMs;
  const dryRun = Boolean(options.dryRun);
  const db = getDb();
  const versionId = newId("ver");
  const versionPlaceholder = dryRun ? "dry_run" : versionId;
  const conflicts: GenerationConflict[] = [];
  const technical: TechnicalDiagnostic[] = [];
  const planned: PlannedAssignment[] = [];
  const regularStack: PlannedAssignment[] = [];
  let bestRegular: PlannedAssignment[] = [];
  let bestScore = -Infinity;
  let iterations = 0;
  let timedOut = false;

  try {
    markStaleGeneratingVersions(campusId);
    const data = loadSchedulerData(campusId);
    const {
      courses,
      subjectsById,
      teachers,
      teachersById,
      assignable,
      blocksById,
      requirements,
      forced,
      projects,
      teacherAvailable,
      teacherUnavailable,
      courseAvailable,
      matrix,
      legacySubjects,
      legacyCourses,
      projectTeachers,
      projectCourses
    } = data;

    const teacherBusy = new Set<string>();
    const courseBusy = new Set<string>();
    const teacherBlocksUsed = new Map<string, number>();
    const courseFreeBlocks = new Map(courses.map((course) => [course.id, 0]));

    const contractualBlocksFor = (teacher: TeacherRow) =>
      teacher.contractual_weekly_minutes > 0 ? Math.round(teacher.contractual_weekly_minutes / 60) : 0;

    const teacherEnabledFor = (teacherId: string, subjectId: string, courseId: string) => {
      if (matrix.has(teacherId)) return matrix.get(teacherId)!.has(`${subjectId}|${courseId}`);
      const subs = legacySubjects.get(teacherId);
      if (!subs?.has(subjectId)) return false;
      const crs = legacyCourses.get(teacherId);
      return !crs || crs.size === 0 || crs.has(courseId);
    };

    const teacherAvailableAt = (teacherId: string, blockId: string) => {
      const av = teacherAvailable.get(teacherId);
      if (av) return av.has(blockId);
      const un = teacherUnavailable.get(teacherId);
      return un ? !un.has(blockId) : true;
    };

    const courseAvailableAt = (courseId: string, blockId: string) => {
      const av = courseAvailable.get(courseId);
      return av ? av.has(blockId) : true;
    };

    const addConflict = (conflict: GenerationConflict) => {
      conflicts.push(conflict);
      if (conflict.technical) technical.push(conflict.technical);
    };

    const teacherCanTakeMore = (teacherId: string) => {
      const teacher = teachersById.get(teacherId);
      if (!teacher) return false;
      const cap = contractualBlocksFor(teacher);
      if (cap <= 0) return true;
      return (teacherBlocksUsed.get(teacherId) ?? 0) < cap;
    };

    const applyAssignment = (assignment: PlannedAssignment, countTeacherLoad = true) => {
      planned.push(assignment);
      if (assignment.teacher_id) {
        teacherBusy.add(`${assignment.teacher_id}|${assignment.time_block_id}`);
        if (countTeacherLoad && blocksById.get(assignment.time_block_id)?.block_value) {
          teacherBlocksUsed.set(assignment.teacher_id, (teacherBlocksUsed.get(assignment.teacher_id) ?? 0) + 1);
        }
      }
      if (assignment.course_id) courseBusy.add(`${assignment.course_id}|${assignment.time_block_id}`);
    };

    const revertAssignment = (assignment: PlannedAssignment, countTeacherLoad = true) => {
      const index = planned.findIndex((item) => item.id === assignment.id);
      if (index >= 0) planned.splice(index, 1);
      if (assignment.teacher_id) {
        teacherBusy.delete(`${assignment.teacher_id}|${assignment.time_block_id}`);
        if (countTeacherLoad && blocksById.get(assignment.time_block_id)?.block_value) {
          teacherBlocksUsed.set(assignment.teacher_id, Math.max(0, (teacherBlocksUsed.get(assignment.teacher_id) ?? 1) - 1));
        }
      }
      if (assignment.course_id) courseBusy.delete(`${assignment.course_id}|${assignment.time_block_id}`);
    };

    for (const row of forced) {
      const block = blocksById.get(row.time_block_id);
      if (!block || !block.is_assignable) {
        addConflict({ type: "FORCED_INVALID_BLOCK", severity: "CRITICAL", message: "Una asignacion forzada apunta a un bloque no asignable.", entity_type: "SYSTEM" });
        continue;
      }
      if (row.teacher_id && teacherBusy.has(`${row.teacher_id}|${row.time_block_id}`)) {
        addConflict({ type: "FORCED_TEACHER_OVERLAP", severity: "CRITICAL", message: `${teachersById.get(row.teacher_id)?.full_name ?? "Un docente"} ya esta ocupado en una asignacion forzada.` });
        continue;
      }
      if (row.course_id && courseBusy.has(`${row.course_id}|${row.time_block_id}`)) {
        addConflict({ type: "FORCED_COURSE_OVERLAP", severity: "CRITICAL", message: "Un curso tiene dos asignaciones forzadas en el mismo bloque.", entity_type: "COURSE", entity_id: row.course_id });
        continue;
      }
      if (row.teacher_id && !row.hard_override && !teacherAvailableAt(row.teacher_id, row.time_block_id)) {
        addConflict({ type: "FORCED_OUTSIDE_AVAILABILITY", severity: "CRITICAL", message: `${teachersById.get(row.teacher_id)?.full_name ?? "Docente"} no esta disponible para una asignacion forzada.` });
        continue;
      }
      if (row.course_id && !row.hard_override && !courseAvailableAt(row.course_id, row.time_block_id)) {
        addConflict({ type: "FORCED_COURSE_UNAVAILABLE", severity: "CRITICAL", message: "El curso no esta disponible para una asignacion forzada.", entity_type: "COURSE", entity_id: row.course_id });
        continue;
      }
      if (row.teacher_id && row.subject_id && row.course_id && !row.hard_override && !teacherEnabledFor(row.teacher_id, row.subject_id, row.course_id)) {
        addConflict({ type: "FORCED_NOT_ELIGIBLE", severity: "CRITICAL", message: "Una asignacion forzada usa un docente no habilitado para esa materia y curso.", entity_type: "COURSE", entity_id: row.course_id });
        continue;
      }
      const title = row.assignment_type === "INSTITUTIONAL_HOUR" ? "Hora institucional" : row.subject_id ? subjectsById.get(row.subject_id)?.name ?? null : row.reason ?? null;
      applyAssignment({
        id: newId("asg"),
        schedule_version_id: versionPlaceholder,
        campus_id: campusId,
        course_id: row.course_id,
        subject_id: row.subject_id,
        teacher_id: row.teacher_id,
        time_block_id: row.time_block_id,
        assignment_type: row.assignment_type,
        title,
        forced: 1
      });
    }

    const placeProject = (project: ProjectRow, severity: Severity) => {
      const teacherIds = projectTeachers.get(project.id) ?? [];
      const courseIds = projectCourses.get(project.id) ?? [];
      const candidateBlocks = project.fixed_time_block_id && !project.flexible
        ? assignable.filter((block) => block.id === project.fixed_time_block_id)
        : assignable;
      let placed = 0;
      for (const block of candidateBlocks) {
        if (placed >= project.weekly_blocks_required) break;
        const teacherCandidates = (teacherIds.length ? teacherIds : [null])
          .filter((id) => !id || (teacherAvailableAt(id, block.id) && !teacherBusy.has(`${id}|${block.id}`) && teacherCanTakeMore(id)))
          .sort((a, b) => {
            if (!a || !b) return a ? -1 : b ? 1 : 0;
            const aTeacher = teachersById.get(a);
            const bTeacher = teachersById.get(b);
            const aCap = aTeacher ? contractualBlocksFor(aTeacher) : 0;
            const bCap = bTeacher ? contractualBlocksFor(bTeacher) : 0;
            const aSlack = aCap > 0 ? aCap - (teacherBlocksUsed.get(a) ?? 0) : 999;
            const bSlack = bCap > 0 ? bCap - (teacherBlocksUsed.get(b) ?? 0) : 999;
            return aSlack - bSlack;
          });
        const coursesFree = courseIds.every((id) => courseAvailableAt(id, block.id) && !courseBusy.has(`${id}|${block.id}`));
        if (!teacherCandidates.length || !coursesFree) continue;
        const selectedTeacherId = teacherCandidates[0];
        const pairs: Array<{ courseId: string | null; teacherId: string | null }> = [];
        if (courseIds.length) {
          for (const courseId of courseIds) pairs.push({ courseId, teacherId: selectedTeacherId });
        } else if (selectedTeacherId) {
          pairs.push({ courseId: null, teacherId: selectedTeacherId });
        } else if (courseIds.length) {
          for (const courseId of courseIds) pairs.push({ courseId, teacherId: null });
        } else {
          pairs.push({ courseId: null, teacherId: null });
        }
        for (const pair of pairs) {
          applyAssignment({
            id: newId("asg"),
            schedule_version_id: versionPlaceholder,
            campus_id: campusId,
            course_id: pair.courseId,
            subject_id: null,
            teacher_id: pair.teacherId,
            time_block_id: block.id,
            assignment_type: project.type,
            title: project.name,
            forced: 0
          });
        }
        placed += 1;
      }
      if (placed < project.weekly_blocks_required) {
        addConflict({
          type: "UNFULFILLED_PROJECT",
          severity,
          message: `No se pudo ubicar ${project.name}: ${placed}/${project.weekly_blocks_required} bloques.`,
          suggestion: "Revisa disponibilidad comun de docentes/cursos o fijaciones horarias.",
          entity_type: "PROJECT",
          entity_id: project.id
        });
      }
      return placed;
    };

    const deferredProjects: ProjectRow[] = [];
    for (const project of projects) {
      const fixedProject = Boolean(project.fixed_time_block_id && !project.flexible);
      if (!fixedProject) {
        deferredProjects.push(project);
        continue;
      }
      placeProject(project, "CRITICAL");
    }

    const forcedRegularCount = new Map<string, number>();
    for (const assignment of planned) {
      if (assignment.assignment_type !== "REGULAR_CLASS" || !assignment.course_id || !assignment.subject_id) continue;
      const key = `${assignment.course_id}|${assignment.subject_id}`;
      forcedRegularCount.set(key, (forcedRegularCount.get(key) ?? 0) + 1);
    }

    const needs: Need[] = [];
    const zeroTeacherRequirements = new Set<string>();
    for (const req of requirements) {
      const eligible = teachers.filter((teacher) => teacherEnabledFor(teacher.id, req.subject_id, req.course_id));
      const key = `${req.course_id}|${req.subject_id}`;
      if (eligible.length === 0) {
        zeroTeacherRequirements.add(key);
        addConflict({
          type: "NO_ELIGIBLE_TEACHER",
          severity: "CRITICAL",
          message: `No hay docente habilitado para ${req.subject_name} en ${req.course_name}.`,
          suggestion: `Habilita un docente para ${req.subject_name} en ${req.course_name}.`,
          entity_type: "COURSE",
          entity_id: req.course_id,
          technical: {
            course: req.course_name,
            subject: req.subject_name,
            candidatesConsidered: 0,
            eligibleTeachers: [],
            validTimeBlocksBeforeConflicts: 0,
            rejectedByReason: { teacher_not_eligible: teachers.length }
          }
        });
        continue;
      }
      const remaining = Math.max(0, req.weekly_blocks_required - (forcedRegularCount.get(key) ?? 0));
      for (let i = 0; i < remaining; i += 1) {
        needs.push({
          courseId: req.course_id,
          subjectId: req.subject_id,
          courseName: req.course_name,
          subjectName: req.subject_name,
          subjectColor: req.subject_color,
          unitIndex: i
        });
      }
    }

    const subjectPriority = (name: string) => {
      const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (normalized.includes("lengua")) return 0;
      if (normalized.includes("matematica")) return 1;
      if (normalized.includes("ciencia")) return 2;
      if (normalized.includes("arte")) return 3;
      if (normalized.includes("geografia")) return 4;
      if (normalized.includes("historia")) return 5;
      if (normalized.includes("ingles")) return 6;
      if (normalized.includes("tutoria") || normalized.includes("tutor")) return 7;
      if (normalized.includes("tecnologia")) return 8;
      if (normalized.includes("fisica") || normalized.includes("educacion fisica")) return 9;
      if (normalized.includes("ciudad")) return 10;
      if (normalized.includes("proyecto")) return 20;
      return 10;
    };
    const staticCandidateCount = (need: Need) => {
      let count = 0;
      for (const teacher of teachers.filter((row) => teacherEnabledFor(row.id, need.subjectId, need.courseId))) {
        for (const block of assignable) {
          if (teacherAvailableAt(teacher.id, block.id) && courseAvailableAt(need.courseId, block.id)) count += 1;
        }
      }
      return count;
    };
    const availabilityByCourse = new Map(courses.map((course) => [
      course.id,
      assignable.filter((block) => courseAvailableAt(course.id, block.id)).length
    ]));
    const requirementLoadByKey = new Map(requirements.map((req) => [`${req.course_id}|${req.subject_id}`, req.weekly_blocks_required]));
    needs.sort((a, b) => {
      const aCandidates = staticCandidateCount(a);
      const bCandidates = staticCandidateCount(b);
      if (aCandidates !== bCandidates) return aCandidates - bCandidates;
      const aTeachers = teachers.filter((teacher) => teacherEnabledFor(teacher.id, a.subjectId, a.courseId)).length;
      const bTeachers = teachers.filter((teacher) => teacherEnabledFor(teacher.id, b.subjectId, b.courseId)).length;
      if (aTeachers !== bTeachers) return aTeachers - bTeachers;
      const aPriority = subjectPriority(a.subjectName);
      const bPriority = subjectPriority(b.subjectName);
      if (aPriority !== bPriority) return aPriority - bPriority;
      const aLoad = requirementLoadByKey.get(`${a.courseId}|${a.subjectId}`) ?? 0;
      const bLoad = requirementLoadByKey.get(`${b.courseId}|${b.subjectId}`) ?? 0;
      if (aLoad !== bLoad) return bLoad - aLoad;
      const aCourseAvail = availabilityByCourse.get(a.courseId) ?? 999;
      const bCourseAvail = availabilityByCourse.get(b.courseId) ?? 999;
      if (aCourseAvail !== bCourseAvail) return aCourseAvail - bCourseAvail;
      return a.subjectName.localeCompare(b.subjectName);
    });

    const baseCandidateCache = new Map<number, Candidate[]>();
    const eligibleTeacherCache = new Map<string, TeacherRow[]>();
    const eligibleForNeed = (need: Need) => {
      const key = `${need.subjectId}|${need.courseId}`;
      const cached = eligibleTeacherCache.get(key);
      if (cached) return cached;
      const eligible = teachers.filter((teacher) => teacherEnabledFor(teacher.id, need.subjectId, need.courseId));
      eligibleTeacherCache.set(key, eligible);
      return eligible;
    };

    const buildBaseCandidates = (needIndex: number) => {
      const cached = baseCandidateCache.get(needIndex);
      if (cached) return cached;
      const need = needs[needIndex];
      const out: Candidate[] = [];
      for (const teacher of eligibleForNeed(need)) {
        for (const block of assignable) {
          if (!teacherAvailableAt(teacher.id, block.id)) continue;
          if (!courseAvailableAt(need.courseId, block.id)) continue;
          out.push({ teacherId: teacher.id, blockId: block.id });
        }
      }
      baseCandidateCache.set(needIndex, out);
      return out;
    };
    for (let index = 0; index < needs.length; index += 1) buildBaseCandidates(index);
    console.log("[scheduler] sorted requirement order", {
      campusId,
      first: needs.slice(0, 20).map((need, index) => ({
        index,
        course: need.courseName,
        subject: need.subjectName,
        eligibleTeachers: eligibleForNeed(need).length,
        candidates: buildBaseCandidates(index).length,
        weeklyLoad: requirementLoadByKey.get(`${need.courseId}|${need.subjectId}`) ?? 0
      })),
      projectPolicy: "fixed projects before regular classes; flexible projects after regular repair"
    });

    const teacherBlockPressure = new Map<string, number>();
    for (let index = 0; index < needs.length; index += 1) {
      for (const candidate of buildBaseCandidates(index)) {
        const key = `${candidate.teacherId}|${candidate.blockId}`;
        teacherBlockPressure.set(key, (teacherBlockPressure.get(key) ?? 0) + 1);
      }
    }

    const placementsByCourseSubject = new Map<string, Array<{ blockId: string; teacherId: string }>>();
    const recordPlacement = (need: Need, candidate: Candidate) => {
      const key = `${need.courseId}|${need.subjectId}`;
      const list = placementsByCourseSubject.get(key) ?? [];
      list.push({ blockId: candidate.blockId, teacherId: candidate.teacherId });
      placementsByCourseSubject.set(key, list);
    };
    const undoPlacement = (need: Need) => {
      placementsByCourseSubject.get(`${need.courseId}|${need.subjectId}`)?.pop();
    };

    const candidateScore = (need: Need, candidate: Candidate) => {
      const block = blocksById.get(candidate.blockId);
      const teacher = teachersById.get(candidate.teacherId);
      const cap = teacher ? contractualBlocksFor(teacher) : 0;
      const slack = cap > 0 ? cap - (teacherBlocksUsed.get(candidate.teacherId) ?? 0) : 100;
      const neighbors = placementsByCourseSubject.get(`${need.courseId}|${need.subjectId}`) ?? [];
      const pressure = teacherBlockPressure.get(`${candidate.teacherId}|${candidate.blockId}`) ?? 0;
      const sameDayNeighbor = neighbors.some((item) => {
        const other = blocksById.get(item.blockId);
        if (!other || !block) return false;
        return other.day_of_week === block.day_of_week && item.teacherId === candidate.teacherId && Math.abs(other.block_index - block.block_index) === 1;
      });
      return (sameDayNeighbor ? -1000 : 0) + pressure * 4 - slack + (block?.day_of_week ?? 9) * 10 + (block?.block_index ?? 99);
    };

    const buildDynamicCandidates = (needIndex: number) => {
      const need = needs[needIndex];
      const candidates = buildBaseCandidates(needIndex).filter((candidate) => {
        if (teacherBusy.has(`${candidate.teacherId}|${candidate.blockId}`)) return false;
        if (courseBusy.has(`${need.courseId}|${candidate.blockId}`)) return false;
        if (!teacherCanTakeMore(candidate.teacherId)) return false;
        return true;
      });
      candidates.sort((a, b) => candidateScore(need, a) - candidateScore(need, b));
      return candidates.slice(0, limits.maxCandidateAttemptsPerNeed);
    };

    const tryConstructiveFullSolve = () => {
      if (forced.length > 0) return false;
      type Task = {
        kind: "REGULAR_CLASS" | "PROJECT";
        courseId: string | null;
        subjectId: string | null;
        title: string;
        assignmentType: string;
        needIndex?: number;
        eligibleTeachers: string[];
        fixedBlockId?: string | null;
      };
      const tasks: Task[] = [];
      for (let index = 0; index < needs.length; index += 1) {
        const need = needs[index];
        tasks.push({
          kind: "REGULAR_CLASS",
          courseId: need.courseId,
          subjectId: need.subjectId,
          title: need.subjectName,
          assignmentType: "REGULAR_CLASS",
          needIndex: index,
          eligibleTeachers: eligibleForNeed(need).map((teacher) => teacher.id)
        });
      }
      for (const project of projects) {
        const courseIds = projectCourses.get(project.id) ?? [null];
        const teacherIds = projectTeachers.get(project.id) ?? [];
        for (let unit = 0; unit < project.weekly_blocks_required; unit += 1) {
          for (const courseId of courseIds.length ? courseIds : [null]) {
            tasks.push({
              kind: "PROJECT",
              courseId,
              subjectId: null,
              title: project.name,
              assignmentType: project.type,
              eligibleTeachers: teacherIds,
              fixedBlockId: project.fixed_time_block_id && !project.flexible ? project.fixed_time_block_id : null
            });
          }
        }
      }

      const hasCompatibleBlockForTask = (task: Task, teacherId: string) =>
        (task.fixedBlockId ? assignable.filter((block) => block.id === task.fixedBlockId) : assignable)
          .some((block) => {
            if (!teacherAvailableAt(teacherId, block.id)) return false;
            if (task.courseId && !courseAvailableAt(task.courseId, block.id)) return false;
            return true;
          });

      const sortedTasks = tasks.sort((a, b) => {
        const aTeachers = a.eligibleTeachers.length || 999;
        const bTeachers = b.eligibleTeachers.length || 999;
        if (aTeachers !== bTeachers) return aTeachers - bTeachers;
        if (a.kind !== b.kind) return a.kind === "REGULAR_CLASS" ? -1 : 1;
        if (a.kind === "REGULAR_CLASS" && b.kind === "REGULAR_CLASS") {
          return subjectPriority(a.title) - subjectPriority(b.title);
        }
        return a.title.localeCompare(b.title);
      });
      type Edge = { to: number; rev: number; cap: number; originalCap: number };
      const graph: Edge[][] = [];
      const addNode = () => {
        graph.push([]);
        return graph.length - 1;
      };
      const addEdge = (from: number, to: number, cap: number) => {
        const forward: Edge = { to, rev: graph[to].length, cap, originalCap: cap };
        const backward: Edge = { to: from, rev: graph[from].length, cap: 0, originalCap: 0 };
        graph[from].push(forward);
        graph[to].push(backward);
        return forward;
      };
      const source = addNode();
      const sink = addNode();
      const teacherNode = new Map<string, number>();
      for (const teacher of teachers) {
        const node = addNode();
        teacherNode.set(teacher.id, node);
        const cap = contractualBlocksFor(teacher);
        addEdge(node, sink, cap > 0 ? cap : tasks.length);
      }
      const taskNodes: number[] = [];
      const taskTeacherEdges: Array<Array<{ teacherId: string; edge: Edge }>> = [];
      const selected: Array<Task & { teacherId: string | null }> = [];
      const flowTasks: Task[] = [];
      for (const task of sortedTasks) {
        const compatibleTeachers = task.eligibleTeachers.filter((teacherId) => hasCompatibleBlockForTask(task, teacherId));
        if (compatibleTeachers.length === 0) {
          console.log("[scheduler] constructive solve has task without compatible teacher/block", {
            campusId,
            task: task.title,
            courseId: task.courseId,
            eligibleTeachers: task.eligibleTeachers.length,
            fixedBlockId: task.fixedBlockId ?? null
          });
          return false;
        }
        const node = addNode();
        taskNodes.push(node);
        flowTasks.push(task);
        addEdge(source, node, 1);
        const edgeList: Array<{ teacherId: string; edge: Edge }> = [];
        const teachersForTask = [...compatibleTeachers].sort((a, b) => {
          const aCap = contractualBlocksFor(teachersById.get(a)!);
          const bCap = contractualBlocksFor(teachersById.get(b)!);
          if ((aCap > 0) !== (bCap > 0)) return aCap > 0 ? -1 : 1;
          return bCap - aCap;
        });
        for (const teacherId of teachersForTask) {
          const nodeTo = teacherNode.get(teacherId);
          if (nodeTo == null) continue;
          edgeList.push({ teacherId, edge: addEdge(node, nodeTo, 1) });
        }
        taskTeacherEdges.push(edgeList);
      }
      const level: number[] = [];
      const it: number[] = [];
      const bfs = () => {
        level.splice(0, level.length, ...Array(graph.length).fill(-1));
        const queue = [source];
        level[source] = 0;
        for (let qi = 0; qi < queue.length; qi += 1) {
          const v = queue[qi];
          for (const edge of graph[v]) {
            if (edge.cap > 0 && level[edge.to] < 0) {
              level[edge.to] = level[v] + 1;
              queue.push(edge.to);
            }
          }
        }
        return level[sink] >= 0;
      };
      const dfs = (v: number, f: number): number => {
        if (v === sink) return f;
        for (; it[v] < graph[v].length; it[v] += 1) {
          const edge = graph[v][it[v]];
          if (edge.cap <= 0 || level[v] >= level[edge.to]) continue;
          const d = dfs(edge.to, Math.min(f, edge.cap));
          if (d <= 0) continue;
          edge.cap -= d;
          graph[edge.to][edge.rev].cap += d;
          return d;
        }
        return 0;
      };
      let flow = 0;
      while (bfs()) {
        it.splice(0, it.length, ...Array(graph.length).fill(0));
        while (true) {
          const f = dfs(source, 1_000_000);
          if (f <= 0) break;
          flow += f;
        }
      }
      if (flow !== flowTasks.length) {
        const unmatched = flowTasks.filter((_, index) => taskTeacherEdges[index].every(({ edge }) => edge.cap === edge.originalCap));
        console.log("[scheduler] constructive solve teacher allocation failed", {
          campusId,
          matched: flow,
          required: flowTasks.length,
          sample: unmatched.slice(0, 5).map((task) => ({ task: task.title, courseId: task.courseId, eligibleTeachers: task.eligibleTeachers.length }))
        });
        return false;
      }
      for (let index = 0; index < flowTasks.length; index += 1) {
        const chosen = taskTeacherEdges[index].find(({ edge }) => edge.originalCap === 1 && edge.cap === 0);
        if (!chosen) return false;
        selected.push({ ...flowTasks[index], teacherId: chosen.teacherId });
      }

      const selectedTeacherLoad = new Map<string, number>();
      for (const task of selected) if (task.teacherId) selectedTeacherLoad.set(task.teacherId, (selectedTeacherLoad.get(task.teacherId) ?? 0) + 1);
      selected.sort((a, b) => {
        const aLoad = a.teacherId ? selectedTeacherLoad.get(a.teacherId) ?? 0 : 0;
        const bLoad = b.teacherId ? selectedTeacherLoad.get(b.teacherId) ?? 0 : 0;
        if (aLoad !== bLoad) return bLoad - aLoad;
        if (a.courseId !== b.courseId) return (a.courseId ?? "").localeCompare(b.courseId ?? "");
        return a.title.localeCompare(b.title);
      });

      const localTeacherBusy = new Map<string, number>();
      const localCourseBusy = new Map<string, number>();
      const assignedBlockByTask = new Map<number, string>();
      const allowedBlocksByTask = selected.map((task) => {
        const blocks = (task.fixedBlockId ? assignable.filter((block) => block.id === task.fixedBlockId) : assignable)
          .filter((block) => {
            if (task.teacherId && !teacherAvailableAt(task.teacherId, block.id)) return false;
            if (task.courseId && !courseAvailableAt(task.courseId, block.id)) return false;
            return true;
          })
          .sort((a, b) => a.day_of_week - b.day_of_week || a.block_index - b.block_index);
        return blocks;
      });

      const blockPressure = new Map<string, number>();
      for (let taskIndex = 0; taskIndex < selected.length; taskIndex += 1) {
        const task = selected[taskIndex];
        for (const block of allowedBlocksByTask[taskIndex]) {
          if (task.teacherId) blockPressure.set(`t:${task.teacherId}|${block.id}`, (blockPressure.get(`t:${task.teacherId}|${block.id}`) ?? 0) + 1);
          if (task.courseId) blockPressure.set(`c:${task.courseId}|${block.id}`, (blockPressure.get(`c:${task.courseId}|${block.id}`) ?? 0) + 1);
        }
      }

      const setLocalTaskBlock = (taskIndex: number, blockId: string | null) => {
        const task = selected[taskIndex];
        const previous = assignedBlockByTask.get(taskIndex);
        if (previous) {
          if (task.teacherId) localTeacherBusy.delete(`${task.teacherId}|${previous}`);
          if (task.courseId) localCourseBusy.delete(`${task.courseId}|${previous}`);
          assignedBlockByTask.delete(taskIndex);
        }
        if (blockId) {
          if (task.teacherId) localTeacherBusy.set(`${task.teacherId}|${blockId}`, taskIndex);
          if (task.courseId) localCourseBusy.set(`${task.courseId}|${blockId}`, taskIndex);
          assignedBlockByTask.set(taskIndex, blockId);
        }
      };

      const blockersForLocalTask = (taskIndex: number, blockId: string) => {
        const task = selected[taskIndex];
        const blockers = new Set<number>();
        if (task.teacherId) {
          const blocker = localTeacherBusy.get(`${task.teacherId}|${blockId}`);
          if (blocker != null && blocker !== taskIndex) blockers.add(blocker);
        }
        if (task.courseId) {
          const blocker = localCourseBusy.get(`${task.courseId}|${blockId}`);
          if (blocker != null && blocker !== taskIndex) blockers.add(blocker);
        }
        return [...blockers];
      };

      const snapshotLocalBlocks = () => new Map(assignedBlockByTask);
      const restoreLocalBlocks = (snapshot: Map<number, string>) => {
        localTeacherBusy.clear();
        localCourseBusy.clear();
        assignedBlockByTask.clear();
        for (const [taskIndex, blockId] of snapshot) setLocalTaskBlock(taskIndex, blockId);
      };

      const localCandidateBlocks = (taskIndex: number, blockedTaskChain: Set<number>) => {
        const task = selected[taskIndex];
        const current = assignedBlockByTask.get(taskIndex);
        return allowedBlocksByTask[taskIndex]
          .filter((block) => block.id !== current)
          .sort((a, b) => {
            const aBlockers = blockersForLocalTask(taskIndex, a.id).filter((index) => !blockedTaskChain.has(index)).length;
            const bBlockers = blockersForLocalTask(taskIndex, b.id).filter((index) => !blockedTaskChain.has(index)).length;
            if (aBlockers !== bBlockers) return aBlockers - bBlockers;
            const aPressure =
              (task.teacherId ? blockPressure.get(`t:${task.teacherId}|${a.id}`) ?? 0 : 0) +
              (task.courseId ? blockPressure.get(`c:${task.courseId}|${a.id}`) ?? 0 : 0);
            const bPressure =
              (task.teacherId ? blockPressure.get(`t:${task.teacherId}|${b.id}`) ?? 0 : 0) +
              (task.courseId ? blockPressure.get(`c:${task.courseId}|${b.id}`) ?? 0 : 0);
            if (aPressure !== bPressure) return aPressure - bPressure;
            return a.day_of_week - b.day_of_week || a.block_index - b.block_index;
          });
      };

      let localRepairAttempts = 0;
      let localRepairSuccesses = 0;
      const maxLocalRepairDepth = Math.max(12, limits.maxBacktrackingDepth * 3);
      const assignLocalTask = (taskIndex: number, depth: number, blockedTaskChain = new Set<number>()): boolean => {
        if (Date.now() > deadline) return false;
        localRepairAttempts += 1;
        if (blockedTaskChain.has(taskIndex)) return false;
        const nextChain = new Set(blockedTaskChain);
        nextChain.add(taskIndex);
        const candidates = localCandidateBlocks(taskIndex, blockedTaskChain);
        for (const block of candidates) {
          const allBlockers = blockersForLocalTask(taskIndex, block.id);
          if (allBlockers.some((index) => blockedTaskChain.has(index))) continue;
          const blockers = allBlockers;
          if (blockers.length === 0) {
            setLocalTaskBlock(taskIndex, block.id);
            return true;
          }
          if (depth <= 0 || blockers.some((index) => selected[index].fixedBlockId)) continue;
          const snapshot = snapshotLocalBlocks();
          setLocalTaskBlock(taskIndex, null);
          for (const blocker of blockers) setLocalTaskBlock(blocker, null);
          setLocalTaskBlock(taskIndex, block.id);
          let movedAll = true;
          for (const blocker of blockers) {
            if (!assignLocalTask(blocker, depth - 1, nextChain)) {
              movedAll = false;
              break;
            }
          }
          if (movedAll) {
            localRepairSuccesses += 1;
            return true;
          }
          restoreLocalBlocks(snapshot);
        }
        return false;
      };

      const taskOrder = selected
        .map((task, index) => ({ task, index, candidates: allowedBlocksByTask[index].length }))
        .sort((a, b) => {
          if (a.candidates !== b.candidates) return a.candidates - b.candidates;
          if (a.task.fixedBlockId !== b.task.fixedBlockId) return a.task.fixedBlockId ? -1 : 1;
          const aLoad = a.task.teacherId ? selectedTeacherLoad.get(a.task.teacherId) ?? 0 : 0;
          const bLoad = b.task.teacherId ? selectedTeacherLoad.get(b.task.teacherId) ?? 0 : 0;
          if (aLoad !== bLoad) return bLoad - aLoad;
          if (a.task.kind !== b.task.kind) return a.task.kind === "REGULAR_CLASS" ? -1 : 1;
          return a.task.title.localeCompare(b.task.title);
        });

      for (const { task, index } of taskOrder) {
        if (allowedBlocksByTask[index].length === 0 || !assignLocalTask(index, maxLocalRepairDepth)) {
          console.log("[scheduler] constructive solve block allocation failed", {
            campusId,
            task: task.title,
            courseId: task.courseId,
            teacher: task.teacherId ? teachersById.get(task.teacherId)?.full_name : null,
            allowedBlocks: allowedBlocksByTask[index].length,
            localRepairAttempts,
            maxLocalRepairDepth
          });
          return false;
        }
      }

      const localAssignments: PlannedAssignment[] = [];
      for (let taskIndex = 0; taskIndex < selected.length; taskIndex += 1) {
        const task = selected[taskIndex];
        const blockId = assignedBlockByTask.get(taskIndex);
        if (!blockId) return false;
        localAssignments.push({
          id: newId("asg"),
          schedule_version_id: versionPlaceholder,
          campus_id: campusId,
          course_id: task.courseId,
          subject_id: task.subjectId,
          teacher_id: task.teacherId,
          time_block_id: blockId,
          assignment_type: task.assignmentType,
          title: task.title,
          forced: 0,
          need_index: task.needIndex
        });
      }

      for (const assignment of localAssignments) applyAssignment(assignment);
      console.log("[scheduler] constructive solve completed", {
        campusId,
        tasks: tasks.length,
        assignments: localAssignments.length,
        teacherLoads: selectedTeacherLoad.size,
        blockRepairAttempts: localRepairAttempts,
        blockRepairSuccesses: localRepairSuccesses
      });
      return true;
    };

    const pickNextNeed = (remaining: Set<number>) => {
      let best: number | null = null;
      let bestCount = Infinity;
      for (const index of remaining) {
        const count = buildDynamicCandidates(index).length;
        if (count < bestCount) {
          best = index;
          bestCount = count;
          if (count === 0) break;
        }
      }
      return best;
    };

    const requiredByCourseSubject = new Map<string, number>();
    for (const req of requirements) {
      requiredByCourseSubject.set(`${req.course_id}|${req.subject_id}`, req.weekly_blocks_required);
    }
    const scoreCurrentRegularPlan = () => {
      const assigned = new Map<string, number>();
      for (const assignment of planned) {
        if (assignment.assignment_type !== "REGULAR_CLASS" || !assignment.course_id || !assignment.subject_id) continue;
        const key = `${assignment.course_id}|${assignment.subject_id}`;
        assigned.set(key, (assigned.get(key) ?? 0) + 1);
      }
      let complete = 0;
      let pending = 0;
      let incompleteCourses = new Set<string>();
      for (const [key, required] of requiredByCourseSubject) {
        const count = assigned.get(key) ?? 0;
        if (count >= required) complete += 1;
        else {
          pending += required - count;
          incompleteCourses.add(key.split("|")[0]);
        }
      }
      let freeInIncomplete = 0;
      for (const courseId of incompleteCourses) {
        for (const block of assignable) {
          if (courseAvailableAt(courseId, block.id) && !courseBusy.has(`${courseId}|${block.id}`)) freeInIncomplete += 1;
        }
      }
      return complete * 10_000 - pending * 10_000 - incompleteCourses.size * 5_000 - freeInIncomplete * 2_000 + planned.length * 5;
    };

    const applyRegularCandidate = (needIndex: number, candidate: Candidate) => {
      const need = needs[needIndex];
      const assignment: PlannedAssignment = {
        id: newId("asg"),
        schedule_version_id: versionPlaceholder,
        campus_id: campusId,
        course_id: need.courseId,
        subject_id: need.subjectId,
        teacher_id: candidate.teacherId,
        time_block_id: candidate.blockId,
        assignment_type: "REGULAR_CLASS",
        title: need.subjectName,
        forced: 0,
        need_index: needIndex
      };
      applyAssignment(assignment);
      recordPlacement(need, candidate);
      regularStack.push(assignment);
      const score = scoreCurrentRegularPlan();
      if (score > bestScore) {
        bestScore = score;
        bestRegular = planned
          .filter((item) => item.assignment_type === "REGULAR_CLASS" && !item.forced)
          .map((item) => ({ ...item }));
        if (bestRegular.length % 25 === 0 || bestRegular.length === needs.length) {
          console.log("[scheduler] best score update", { campusId, score, assignments: bestRegular.length, iterations });
        }
      }
      return assignment;
    };

    const revertRegularCandidate = (needIndex: number, assignment: PlannedAssignment) => {
      undoPlacement(needs[needIndex]);
      regularStack.pop();
      revertAssignment(assignment);
    };

    const removePlacement = (need: Need, candidate: Candidate) => {
      const key = `${need.courseId}|${need.subjectId}`;
      const list = placementsByCourseSubject.get(key);
      if (!list) return;
      const index = list.findIndex((item) => item.blockId === candidate.blockId && item.teacherId === candidate.teacherId);
      if (index >= 0) list.splice(index, 1);
    };

    const removeRegularAssignment = (assignment: PlannedAssignment) => {
      if (typeof assignment.need_index === "number" && assignment.teacher_id) {
        removePlacement(needs[assignment.need_index], { teacherId: assignment.teacher_id, blockId: assignment.time_block_id });
      }
      const stackIndex = regularStack.findIndex((item) => item.id === assignment.id);
      if (stackIndex >= 0) regularStack.splice(stackIndex, 1);
      revertAssignment(assignment);
    };

    const restoreRegularAssignment = (assignment: PlannedAssignment) => {
      applyAssignment(assignment);
      if (typeof assignment.need_index === "number" && assignment.teacher_id) {
        recordPlacement(needs[assignment.need_index], { teacherId: assignment.teacher_id, blockId: assignment.time_block_id });
      }
      regularStack.push(assignment);
    };

    const search = (remaining: Set<number>, depth: number): boolean => {
      if (remaining.size === 0) return true;
      iterations += 1;
      if (Date.now() > deadline || iterations >= limits.maxIterations || depth >= limits.maxBacktrackingDepth) {
        timedOut = true;
        return false;
      }
      const next = pickNextNeed(remaining);
      if (next === null) return false;
      const candidates = buildDynamicCandidates(next);
      if (candidates.length === 0) return false;
      remaining.delete(next);
      for (const candidate of candidates) {
        const assignment = applyRegularCandidate(next, candidate);
        if (search(remaining, depth + 1)) return true;
        revertRegularCandidate(next, assignment);
        if (timedOut) {
          remaining.add(next);
          return false;
        }
      }
      remaining.add(next);
      return false;
    };

    const clearGeneratedRegularAssignments = () => {
      for (const assignment of [...planned].filter((item) => item.assignment_type === "REGULAR_CLASS" && !item.forced)) {
        revertAssignment(assignment);
      }
      regularStack.length = 0;
      placementsByCourseSubject.clear();
    };
    const assignedNeedIndexes = () => new Set(
      planned
        .filter((item) => item.assignment_type === "REGULAR_CLASS" && !item.forced && typeof item.need_index === "number")
        .map((item) => item.need_index!)
    );
    const greedyFillRemaining = () => {
      let progress = true;
      while (progress && Date.now() < deadline) {
        progress = false;
        const assigned = assignedNeedIndexes();
        const remaining = needs
          .map((_, index) => index)
          .filter((index) => !assigned.has(index))
          .sort((a, b) => buildDynamicCandidates(a).length - buildDynamicCandidates(b).length);
        for (const index of remaining) {
          if (Date.now() >= deadline) {
            timedOut = true;
            return;
          }
          iterations += 1;
          if (iterations >= limits.maxIterations) {
            timedOut = true;
            return;
          }
          const candidate = buildDynamicCandidates(index)[0];
          if (!candidate) continue;
          applyRegularCandidate(index, candidate);
          progress = true;
        }
      }
    };

    const pendingNeedIndexes = () => {
      const assigned = assignedNeedIndexes();
      return needs.map((_, index) => index).filter((index) => !assigned.has(index));
    };

    const countFreeBlocksForPendingCourses = () => {
      const pendingCourseIds = new Set(pendingNeedIndexes().map((index) => needs[index].courseId));
      let free = 0;
      for (const courseId of pendingCourseIds) {
        for (const block of assignable) {
          if (courseAvailableAt(courseId, block.id) && !courseBusy.has(`${courseId}|${block.id}`)) free += 1;
        }
      }
      return free;
    };

    const assignmentGroup = (assignment: PlannedAssignment) => {
      if (assignment.forced) return [];
      if (assignment.assignment_type === "INSTITUTIONAL_HOUR") return [];
      if (assignment.assignment_type !== "REGULAR_CLASS") {
        return planned.filter((item) =>
          !item.forced &&
          item.assignment_type === assignment.assignment_type &&
          item.title === assignment.title &&
          item.time_block_id === assignment.time_block_id
        );
      }
      return [assignment];
    };

    const canPlaceGroupAt = (group: PlannedAssignment[], blockId: string) => {
      if (!group.length) return false;
      const groupIds = new Set(group.map((item) => item.id));
      for (const item of group) {
        if (item.teacher_id && !teacherAvailableAt(item.teacher_id, blockId)) return false;
        if (item.course_id && !courseAvailableAt(item.course_id, blockId)) return false;
        if (item.teacher_id) {
          const busy = planned.find((other) =>
            other.teacher_id === item.teacher_id &&
            other.time_block_id === blockId &&
            !groupIds.has(other.id)
          );
          if (busy) return false;
        }
        if (item.course_id) {
          const busy = planned.find((other) =>
            other.course_id === item.course_id &&
            other.time_block_id === blockId &&
            !groupIds.has(other.id)
          );
          if (busy) return false;
        }
      }
      return true;
    };

    const moveGroupToBlock = (group: PlannedAssignment[], blockId: string) => {
      for (const item of group) {
        if (item.teacher_id) teacherBusy.delete(`${item.teacher_id}|${item.time_block_id}`);
        if (item.course_id) courseBusy.delete(`${item.course_id}|${item.time_block_id}`);
      }
      for (const item of group) item.time_block_id = blockId;
      for (const item of group) {
        if (item.teacher_id) teacherBusy.add(`${item.teacher_id}|${item.time_block_id}`);
        if (item.course_id) courseBusy.add(`${item.course_id}|${item.time_block_id}`);
      }
    };

    const restoreGroupBlocks = (snapshot: Array<{ item: PlannedAssignment; blockId: string }>) => {
      for (const { item } of snapshot) {
        if (item.teacher_id) teacherBusy.delete(`${item.teacher_id}|${item.time_block_id}`);
        if (item.course_id) courseBusy.delete(`${item.course_id}|${item.time_block_id}`);
      }
      for (const { item, blockId } of snapshot) item.time_block_id = blockId;
      for (const { item } of snapshot) {
        if (item.teacher_id) teacherBusy.add(`${item.teacher_id}|${item.time_block_id}`);
        if (item.course_id) courseBusy.add(`${item.course_id}|${item.time_block_id}`);
      }
    };

    const findAlternativeBlockForGroup = (group: PlannedAssignment[], blockedBlockId: string) => {
      for (const block of assignable) {
        if (block.id === blockedBlockId) continue;
        if (canPlaceGroupAt(group, block.id)) return block.id;
      }
      return null;
    };

    const findBlocker = (predicate: (assignment: PlannedAssignment) => boolean) =>
      planned.find((assignment) => !assignment.forced && assignment.assignment_type !== "INSTITUTIONAL_HOUR" && predicate(assignment));

    let repairAttempts = 0;
    let repairSwaps = 0;
    let repairAssignments = 0;
    let maxRepairDepthReached = 0;
    type RepairSnapshot = {
      planned: PlannedAssignment[];
      regularStackIds: string[];
      teacherBusy: Set<string>;
      courseBusy: Set<string>;
      teacherBlocksUsed: Map<string, number>;
      placements: Map<string, Array<{ blockId: string; teacherId: string }>>;
      bestScore: number;
      bestRegular: PlannedAssignment[];
    };
    const snapshotState = (): RepairSnapshot => ({
      planned: planned.map((item) => ({ ...item })),
      regularStackIds: regularStack.map((item) => item.id),
      teacherBusy: new Set(teacherBusy),
      courseBusy: new Set(courseBusy),
      teacherBlocksUsed: new Map(teacherBlocksUsed),
      placements: new Map([...placementsByCourseSubject.entries()].map(([key, value]) => [key, value.map((item) => ({ ...item }))])),
      bestScore,
      bestRegular: bestRegular.map((item) => ({ ...item }))
    });
    const restoreState = (snapshot: RepairSnapshot) => {
      planned.splice(0, planned.length, ...snapshot.planned.map((item) => ({ ...item })));
      const byId = new Map(planned.map((item) => [item.id, item]));
      regularStack.splice(0, regularStack.length, ...snapshot.regularStackIds.map((id) => byId.get(id)).filter(Boolean) as PlannedAssignment[]);
      teacherBusy.clear();
      snapshot.teacherBusy.forEach((value) => teacherBusy.add(value));
      courseBusy.clear();
      snapshot.courseBusy.forEach((value) => courseBusy.add(value));
      teacherBlocksUsed.clear();
      snapshot.teacherBlocksUsed.forEach((value, key) => teacherBlocksUsed.set(key, value));
      placementsByCourseSubject.clear();
      snapshot.placements.forEach((value, key) => placementsByCourseSubject.set(key, value.map((item) => ({ ...item }))));
      bestScore = snapshot.bestScore;
      bestRegular = snapshot.bestRegular.map((item) => ({ ...item }));
    };
    const isNeedAssigned = (needIndex: number) =>
      planned.some((item) => item.assignment_type === "REGULAR_CLASS" && item.need_index === needIndex);
    const canPlaceRegularCandidateNow = (needIndex: number, candidate: Candidate) => {
      const need = needs[needIndex];
      if (!teacherAvailableAt(candidate.teacherId, candidate.blockId)) return false;
      if (!courseAvailableAt(need.courseId, candidate.blockId)) return false;
      if (teacherBusy.has(`${candidate.teacherId}|${candidate.blockId}`)) return false;
      if (courseBusy.has(`${need.courseId}|${candidate.blockId}`)) return false;
      if (!teacherCanTakeMore(candidate.teacherId)) return false;
      return true;
    };
    const movableRegularBlockersFor = (needIndex: number, candidate: Candidate) => {
      const need = needs[needIndex];
      const blockers = new Map<string, PlannedAssignment>();
      const add = (assignment: PlannedAssignment | undefined) => {
        if (!assignment || assignment.forced || assignment.assignment_type !== "REGULAR_CLASS" || typeof assignment.need_index !== "number") return;
        blockers.set(assignment.id, assignment);
      };
      add(findBlocker((assignment) => assignment.teacher_id === candidate.teacherId && assignment.time_block_id === candidate.blockId));
      add(findBlocker((assignment) => assignment.course_id === need.courseId && assignment.time_block_id === candidate.blockId));
      if (!teacherCanTakeMore(candidate.teacherId)) {
        for (const assignment of planned) {
          if (assignment.teacher_id === candidate.teacherId && assignment.assignment_type === "REGULAR_CLASS" && !assignment.forced && typeof assignment.need_index === "number") {
            add(assignment);
          }
        }
      }
      return [...blockers.values()].sort((a, b) => {
        const aNeed = typeof a.need_index === "number" ? a.need_index : -1;
        const bNeed = typeof b.need_index === "number" ? b.need_index : -1;
        const aFlex = aNeed >= 0 ? buildBaseCandidates(aNeed).length : 0;
        const bFlex = bNeed >= 0 ? buildBaseCandidates(bNeed).length : 0;
        if (aFlex !== bFlex) return bFlex - aFlex;
        const aPriority = aNeed >= 0 ? subjectPriority(needs[aNeed].subjectName) : 99;
        const bPriority = bNeed >= 0 ? subjectPriority(needs[bNeed].subjectName) : 99;
        return bPriority - aPriority;
      });
    };
    const clearForCandidate = (needIndex: number, candidate: Candidate, depth: number, visiting: Set<number>, removedNeeds: number[]): boolean => {
      maxRepairDepthReached = Math.max(maxRepairDepthReached, limits.maxBacktrackingDepth - depth);
      if (canPlaceRegularCandidateNow(needIndex, candidate)) return true;
      if (depth <= 0) return false;
      if (Date.now() >= deadline || iterations >= limits.maxIterations) {
        timedOut = true;
        return false;
      }
      const blockers = movableRegularBlockersFor(needIndex, candidate);
      for (const blocker of blockers) {
        if (typeof blocker.need_index !== "number" || visiting.has(blocker.need_index)) continue;
        const snapshot = snapshotState();
        const removedLength = removedNeeds.length;
        visiting.add(blocker.need_index);
        removeRegularAssignment(blocker);
        removedNeeds.push(blocker.need_index);
        repairSwaps += 1;
        iterations += 1;
        if (clearForCandidate(needIndex, candidate, depth - 1, visiting, removedNeeds)) {
          visiting.delete(blocker.need_index);
          return true;
        }
        visiting.delete(blocker.need_index);
        removedNeeds.length = removedLength;
        restoreState(snapshot);
        if (timedOut) return false;
      }
      return false;
    };
    const tryPlaceNeedWithRepair = (needIndex: number, depth: number, visiting: Set<number>): boolean => {
      if (isNeedAssigned(needIndex)) return true;
      if (depth < 0 || visiting.has(needIndex)) return false;
      visiting.add(needIndex);
      const need = needs[needIndex];
      const candidates = buildBaseCandidates(needIndex)
        .sort((a, b) => candidateScore(need, a) - candidateScore(need, b))
        .slice(0, Math.max(limits.maxCandidateAttemptsPerNeed, 120));
      for (const candidate of candidates) {
        if (Date.now() >= deadline || iterations >= limits.maxIterations) {
          timedOut = true;
          visiting.delete(needIndex);
          return false;
        }
        repairAttempts += 1;
        iterations += 1;
        const snapshot = snapshotState();
        const removedNeeds: number[] = [];
        if (clearForCandidate(needIndex, candidate, depth, visiting, removedNeeds)) {
          applyRegularCandidate(needIndex, candidate);
          let restored = true;
          for (const removedNeed of [...new Set(removedNeeds)].reverse()) {
            if (!tryPlaceNeedWithRepair(removedNeed, depth - 1, visiting)) {
              restored = false;
              break;
            }
          }
          if (restored && isNeedAssigned(needIndex)) {
            repairAssignments += 1;
            visiting.delete(needIndex);
            return true;
          }
        }
        restoreState(snapshot);
        if (timedOut) {
          visiting.delete(needIndex);
          return false;
        }
      }
      visiting.delete(needIndex);
      return false;
    };
    const tryRepairNeed = (needIndex: number) => {
      return tryPlaceNeedWithRepair(needIndex, limits.maxBacktrackingDepth, new Set());
    };

    const repairPendingRegularNeeds = () => {
      let progress = true;
      while (progress && Date.now() < deadline && iterations < limits.maxIterations) {
        progress = false;
        const remaining = pendingNeedIndexes().sort((a, b) => buildBaseCandidates(a).length - buildBaseCandidates(b).length);
        for (const index of remaining) {
          if (tryRepairNeed(index)) progress = true;
          if (Date.now() >= deadline || iterations >= limits.maxIterations) {
            timedOut = true;
            return;
          }
        }
      }
    };

    console.log("[scheduler] generation started", {
      campusId,
      counts: {
        courses: courses.length,
        subjects: subjectsById.size,
        teachers: teachers.length,
        timeBlocks: assignable.length,
        requirements: requirements.length,
        needs: needs.length
      },
      limits
    });
    const constructiveSolved = tryConstructiveFullSolve();
    if (!constructiveSolved) {
      console.log("[scheduler] quick solve started", { campusId });
      greedyFillRemaining();
      console.log("[scheduler] quick solve completed", { campusId, assignments: bestRegular.length, bestScore, iterations });
      const pendingBeforeRepair = pendingNeedIndexes().length;
      const freeBeforeRepair = countFreeBlocksForPendingCourses();
      console.log("[scheduler] repair started", { campusId, pendingBeforeRepair, freeBeforeRepair });
      repairPendingRegularNeeds();
      const pendingAfterRepair = pendingNeedIndexes().length;
      const freeAfterRepair = countFreeBlocksForPendingCourses();
      console.log("[scheduler] repair completed", {
        campusId,
        repairAttempts,
        successfulSwaps: repairSwaps,
        successfulAssignments: repairAssignments,
        maxRepairDepthReached,
        pendingBeforeRepair,
        pendingAfterRepair,
        freeBeforeRepair,
        freeAfterRepair
      });

      console.log("[scheduler] flexible projects started", { campusId, count: deferredProjects.length, reason: "after regular classes and repair so projects remain movable" });
      deferredProjects.sort((a, b) => {
        const aCourses = projectCourses.get(a.id)?.length ?? 0;
        const bCourses = projectCourses.get(b.id)?.length ?? 0;
        const aTeachers = projectTeachers.get(a.id)?.length ?? 0;
        const bTeachers = projectTeachers.get(b.id)?.length ?? 0;
        if (aCourses !== bCourses) return bCourses - aCourses;
        if (aTeachers !== bTeachers) return aTeachers - bTeachers;
        return a.name.localeCompare(b.name);
      });
      for (const project of deferredProjects) placeProject(project, "WARNING");
      console.log("[scheduler] flexible projects completed", { campusId, count: deferredProjects.length });
    }

    const assignedByRequirement = new Map<string, number>();
    for (const assignment of planned) {
      if (assignment.assignment_type !== "REGULAR_CLASS" || !assignment.course_id || !assignment.subject_id) continue;
      const key = `${assignment.course_id}|${assignment.subject_id}`;
      assignedByRequirement.set(key, (assignedByRequirement.get(key) ?? 0) + 1);
    }

    let pendingBlocks = 0;
    const pendingByCourse = new Map<string, Array<{ subject: string; missing: number }>>();
    for (const req of requirements) {
      const key = `${req.course_id}|${req.subject_id}`;
      if (zeroTeacherRequirements.has(key)) {
        pendingBlocks += req.weekly_blocks_required;
        continue;
      }
      const assigned = assignedByRequirement.get(key) ?? 0;
      if (assigned >= req.weekly_blocks_required) continue;
      const missing = req.weekly_blocks_required - assigned;
      pendingBlocks += missing;
      pendingByCourse.set(req.course_id, [...(pendingByCourse.get(req.course_id) ?? []), { subject: req.subject_name, missing }]);
      const diag = buildRequirementDiagnostic({
        req,
        teachers,
        assignable,
        teacherEnabledFor,
        teacherAvailableAt,
        courseAvailableAt,
        teacherBusy,
        courseBusy,
        teacherCanTakeMore,
        blocksById,
        planned,
        teachersById,
        subjectsById,
        coursesById: new Map(courses.map((course) => [course.id, course]))
      });
      addConflict({
        type: "UNFULFILLED_REQUIREMENT",
        severity: "CRITICAL",
        message: `Faltan ${missing} bloque(s) de ${req.subject_name} en ${req.course_name}.`,
        suggestion: buildReadableSuggestion(req, assigned, missing, diag),
        entity_type: "COURSE",
        entity_id: req.course_id,
        technical: diag
      });
    }

    for (const course of courses) {
      let free = 0;
      for (const block of assignable) {
        if (courseAvailableAt(course.id, block.id) && !courseBusy.has(`${course.id}|${block.id}`)) free += 1;
      }
      courseFreeBlocks.set(course.id, free);
      if (free > 0) {
        const pending = pendingByCourse.get(course.id) ?? [];
        addConflict({
          type: "FREE_COURSE_BLOCKS",
          severity: pending.length ? "CRITICAL" : "WARNING",
          message: pending.length
            ? `El curso ${course.name} tiene ${free} bloque(s) libre(s), pero todavia faltan materias requeridas. El motor no encontro una combinacion valida.`
            : `El curso ${course.name} tiene ${free} bloque(s) libre(s).`,
          suggestion: pending.length
            ? `Materias pendientes: ${pending.map((item) => `${item.subject} (${item.missing})`).join(", ")}. Revisa las asignaciones bloqueantes del diagnostico tecnico.`
            : "Si hay materias pendientes, revisa disponibilidad docente o habilitaciones.",
          entity_type: "COURSE",
          entity_id: course.id
        });
      }
    }

    const hasCriticalBeforeInstitutional = conflicts.some((conflict) => conflict.severity === "CRITICAL");
    let institutionalHoursGenerated = 0;
    if (!hasCriticalBeforeInstitutional) {
      for (const teacher of teachers) {
        if (!teacher.allow_institutional_hours) continue;
        const cap = contractualBlocksFor(teacher);
        if (cap <= 0) continue;
        let remaining = cap - (teacherBlocksUsed.get(teacher.id) ?? 0);
        if (remaining <= 0) continue;
        for (const block of assignable) {
          if (remaining <= 0) break;
          if (!teacherAvailableAt(teacher.id, block.id)) continue;
          if (teacherBusy.has(`${teacher.id}|${block.id}`)) continue;
          applyAssignment({
            id: newId("asg"),
            schedule_version_id: versionPlaceholder,
            campus_id: campusId,
            course_id: null,
            subject_id: null,
            teacher_id: teacher.id,
            time_block_id: block.id,
            assignment_type: "INSTITUTIONAL_HOUR",
            title: "Hora institucional",
            forced: 0
          });
          institutionalHoursGenerated += 1;
          remaining -= 1;
        }
      }
    }

    let coursesComplete = 0;
    let coursesWithPending = 0;
    for (const course of courses) {
      const required = requirements.filter((req) => req.course_id === course.id).reduce((sum, req) => sum + req.weekly_blocks_required, 0);
      const assigned = [...assignedByRequirement.entries()]
        .filter(([key]) => key.startsWith(`${course.id}|`))
        .reduce((sum, [, count]) => sum + count, 0);
      if (required > 0 && assigned >= required) coursesComplete += 1;
      else if (required > 0) coursesWithPending += 1;
    }

    let teachersComplete = 0;
    let teachersIncomplete = 0;
    let teachersWithInstitutional = 0;
    for (const teacher of teachers) {
      const cap = contractualBlocksFor(teacher);
      const used = teacherBlocksUsed.get(teacher.id) ?? 0;
      const institutional = planned.filter((assignment) => assignment.teacher_id === teacher.id && assignment.assignment_type === "INSTITUTIONAL_HOUR").length;
      if (institutional > 0) teachersWithInstitutional += 1;
      if (cap <= 0 || used >= cap) teachersComplete += 1;
      else {
        teachersIncomplete += 1;
        addConflict({
          type: "TEACHER_UNDERLOAD",
          severity: "WARNING",
          message: `${teacher.full_name}: carga ${used}/${cap} bloques pedagogicos.`,
          suggestion: "Amplia disponibilidad, suma clases u horas institucionales si corresponde.",
          entity_type: "TEACHER",
          entity_id: teacher.id
        });
      }
    }

    const hasUsableAssignments = planned.some((assignment) =>
      ["REGULAR_CLASS", "INSTITUTIONAL_HOUR", "PROJECT", "ELECTIVE", "OPTATIVE", "WORKSHOP", "CITIZENSHIP", "INTERDISCIPLINARY"].includes(assignment.assignment_type)
    );
    const hasCriticalConflicts = conflicts.some((conflict) => conflict.severity === "CRITICAL");
    const status: GenerationStatus =
      pendingBlocks === 0 && !hasCriticalConflicts ? "SUCCESS" :
      hasUsableAssignments ? "PARTIAL" :
      timedOut ? "FAILED_TIMEOUT" :
      "FAILED_ERROR";
    if (timedOut) {
      console.log("[scheduler] timeout reached", { campusId, iterations, bestAssignments: bestRegular.length, maxRuntimeMs: limits.maxRuntimeMs });
    }
    const userMessage = status === "SUCCESS"
      ? "Horario generado correctamente."
      : status === "PARTIAL"
        ? "Horario generado parcialmente."
      : status === "FAILED_TIMEOUT"
        ? "No se pudo completar la generacion dentro del tiempo maximo. Proba ampliar disponibilidad, reducir restricciones o revisar el diagnostico."
        : "No se pudo generar el horario. Revisa el diagnostico tecnico o ajusta los datos.";

    const summary = {
      coursesComplete,
      coursesWithPending,
      pendingBlocks,
      freeCourseBlocks: [...courseFreeBlocks.values()].reduce((sum, count) => sum + count, 0),
      teachersComplete,
      teachersIncomplete,
      teachersWithInstitutional,
      institutionalHoursGenerated,
      critical: conflicts.filter((c) => c.severity === "CRITICAL").length,
      warnings: conflicts.filter((c) => c.severity === "WARNING").length,
      iterations,
      assignments: planned.length
    };

    const usableStatus = status === "SUCCESS" || status === "PARTIAL";
    const entries = materializeEntries(planned, data, usableStatus ? versionId : versionPlaceholder);
    console.log("[scheduler] generation completed", { campusId, status, durationMs: Date.now() - startedAt, summary });
    const persistedVersionId = dryRun ? null : persistGeneration(campusId, versionId, status, planned, conflicts);
    const durationMs = Date.now() - startedAt;

    return {
      status,
      userMessage,
      entries: usableStatus ? entries : [],
      conflicts,
      scheduleVersionId: persistedVersionId,
      durationMs,
      dryRun,
      summary,
      diagnostics: { durationMs, timedOut, iterations, technical }
    };
  } catch (error) {
    console.error("[scheduler] generation failed", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    const durationMs = Date.now() - startedAt;
    const conflict: GenerationConflict = {
      type: "GENERATION_EXCEPTION",
      severity: "CRITICAL",
      message: "No se pudo generar el horario. Revisa el diagnostico tecnico o ajusta los datos.",
      suggestion: message,
      entity_type: "SYSTEM"
    };
    const persistedVersionId = dryRun ? null : persistGeneration(campusId, versionId, "FAILED_ERROR", [], [conflict]);
    return {
      status: "FAILED_ERROR",
      userMessage: "No se pudo generar el horario. Revisa el diagnostico tecnico o ajusta los datos.",
      entries: [],
      conflicts: [conflict],
      scheduleVersionId: persistedVersionId,
      durationMs,
      dryRun,
      summary: {
        coursesComplete: 0,
        coursesWithPending: 0,
        pendingBlocks: 0,
        freeCourseBlocks: 0,
        teachersComplete: 0,
        teachersIncomplete: 0,
        teachersWithInstitutional: 0,
        institutionalHoursGenerated: 0,
        critical: 1,
        warnings: 0,
        iterations,
        assignments: 0
      },
      diagnostics: { durationMs, timedOut, iterations, technical }
    };
  }
}

export function getLatestScheduleForCampus(campusId: string): ScheduleAssignmentRow[] {
  const version = getLatestActiveScheduleVersionMeta(campusId);
  if (!version) return [];
  return loadEntriesForVersion(version.id);
}

export function getLatestScheduleConflicts(campusId: string): Array<{ id: string; type: string; severity: Severity; message: string; suggestion: string | null; entity_type: string | null; entity_id: string | null }> {
  const version = getLatestScheduleVersionMeta(campusId);
  if (!version) return [];
  return getDb()
    .prepare(
      `SELECT id, type, severity, message, suggestion, entity_type, entity_id
       FROM conflicts
       WHERE schedule_version_id = ?
       ORDER BY CASE severity WHEN 'CRITICAL' THEN 0 WHEN 'WARNING' THEN 1 ELSE 2 END, created_at`
    )
    .all(version.id) as never;
}

export function getLatestScheduleVersionMeta(campusId: string, status?: ScheduleVersionStatus) {
  markStaleGeneratingVersions(campusId);
  const sql = status
    ? "SELECT id, status, name, generated_at, created_at, updated_at FROM schedule_versions WHERE campus_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1"
    : "SELECT id, status, name, generated_at, created_at, updated_at FROM schedule_versions WHERE campus_id = ? ORDER BY created_at DESC LIMIT 1";
  const args = status ? [campusId, status] : [campusId];
  return getDb().prepare(sql).get(...args) as { id: string; status: ScheduleVersionStatus; name: string; generated_at: string | null; created_at: string; updated_at: string } | undefined;
}

export function getLatestActiveScheduleVersionMeta(campusId: string) {
  markStaleGeneratingVersions(campusId);
  return getDb()
    .prepare(
      `SELECT id, status, name, generated_at, created_at, updated_at
       FROM schedule_versions
       WHERE campus_id = ? AND status IN ('COMPLETED','PARTIAL')
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(campusId) as { id: string; status: ScheduleVersionStatus; name: string; generated_at: string | null; created_at: string; updated_at: string } | undefined;
}

function loadSchedulerData(campusId: string) {
  const db = getDb();
  const courses = db.prepare("SELECT id, name, campus_id FROM courses WHERE campus_id = ? AND is_active = 1 ORDER BY year, division, name").all(campusId) as CourseRow[];
  const subjects = db.prepare("SELECT id, name, color FROM subjects WHERE campus_id = ? AND is_active = 1").all(campusId) as SubjectRow[];
  const teachers = db.prepare("SELECT id, full_name, contractual_weekly_minutes, allow_institutional_hours FROM teachers WHERE campus_id = ? AND is_active = 1 ORDER BY full_name").all(campusId) as TeacherRow[];
  const timeBlocks = db
    .prepare(
      `SELECT id, campus_id, day_of_week, block_index, start_time, end_time, duration_minutes, block_value, label, type, is_assignable
       FROM time_blocks WHERE campus_id = ? ORDER BY day_of_week, block_index, start_time`
    )
    .all(campusId) as TimeBlockRow[];
  const assignable = timeBlocks.filter((block) => block.is_assignable && block.type === "CLASS" && block.block_value > 0);
  const requirements = db
    .prepare(
      `SELECT csr.course_id, csr.subject_id, csr.weekly_blocks_required,
              c.name AS course_name, s.name AS subject_name, s.color AS subject_color
       FROM course_subject_requirements csr
       JOIN courses c ON c.id = csr.course_id
       JOIN subjects s ON s.id = csr.subject_id
       WHERE csr.campus_id = ? AND c.is_active = 1 AND s.is_active = 1 AND csr.weekly_blocks_required > 0`
    )
    .all(campusId) as RequirementRow[];
  const forced = db.prepare("SELECT * FROM forced_assignments WHERE campus_id = ? AND is_active = 1 ORDER BY created_at").all(campusId) as ForcedRow[];
  const rawProjects = db.prepare("SELECT id, name, type, fixed_time_block_id, weekly_blocks_required, flexible FROM projects WHERE campus_id = ? AND is_active = 1 ORDER BY fixed_time_block_id IS NULL, name, id").all(campusId) as ProjectRow[];

  const teacherAvailable = new Map<string, Set<string>>();
  const teacherUnavailable = new Map<string, Set<string>>();
  for (const row of db
    .prepare(
      `SELECT ta.teacher_id, ta.time_block_id, ta.status
       FROM teacher_availability ta JOIN teachers t ON t.id = ta.teacher_id
       WHERE t.campus_id = ?`
    )
    .all(campusId) as Array<{ teacher_id: string; time_block_id: string; status: string }>) {
    const target = row.status === "AVAILABLE" ? teacherAvailable : teacherUnavailable;
    if (!target.has(row.teacher_id)) target.set(row.teacher_id, new Set());
    target.get(row.teacher_id)!.add(row.time_block_id);
  }

  const courseAvailable = new Map<string, Set<string>>();
  for (const row of db
    .prepare(
      `SELECT ca.course_id, ca.time_block_id
       FROM course_availability ca JOIN courses c ON c.id = ca.course_id
       WHERE c.campus_id = ? AND ca.status = 'AVAILABLE'`
    )
    .all(campusId) as Array<{ course_id: string; time_block_id: string }>) {
    if (!courseAvailable.has(row.course_id)) courseAvailable.set(row.course_id, new Set());
    courseAvailable.get(row.course_id)!.add(row.time_block_id);
  }

  const matrix = new Map<string, Set<string>>();
  for (const row of db
    .prepare(
      `SELECT tsce.teacher_id, tsce.subject_id, tsce.course_id
       FROM teacher_subject_course_eligibility tsce
       JOIN teachers t ON t.id = tsce.teacher_id
       WHERE t.campus_id = ?`
    )
    .all(campusId) as Array<{ teacher_id: string; subject_id: string; course_id: string }>) {
    if (!matrix.has(row.teacher_id)) matrix.set(row.teacher_id, new Set());
    matrix.get(row.teacher_id)!.add(`${row.subject_id}|${row.course_id}`);
  }

  const legacySubjects = new Map<string, Set<string>>();
  for (const row of db.prepare("SELECT teacher_id, subject_id FROM teacher_subjects").all() as Array<{ teacher_id: string; subject_id: string }>) {
    if (!legacySubjects.has(row.teacher_id)) legacySubjects.set(row.teacher_id, new Set());
    legacySubjects.get(row.teacher_id)!.add(row.subject_id);
  }
  const legacyCourses = new Map<string, Set<string>>();
  for (const row of db.prepare("SELECT teacher_id, course_id FROM teacher_course_eligibility").all() as Array<{ teacher_id: string; course_id: string }>) {
    if (!legacyCourses.has(row.teacher_id)) legacyCourses.set(row.teacher_id, new Set());
    legacyCourses.get(row.teacher_id)!.add(row.course_id);
  }

  const rawProjectTeachers = new Map<string, string[]>();
  for (const row of db
    .prepare("SELECT pt.project_id, pt.teacher_id FROM project_teachers pt JOIN projects p ON p.id = pt.project_id WHERE p.campus_id = ?")
    .all(campusId) as Array<{ project_id: string; teacher_id: string }>) {
    rawProjectTeachers.set(row.project_id, [...(rawProjectTeachers.get(row.project_id) ?? []), row.teacher_id]);
  }
  const rawProjectCourses = new Map<string, string[]>();
  for (const row of db
    .prepare("SELECT pc.project_id, pc.course_id FROM project_courses pc JOIN projects p ON p.id = pc.project_id WHERE p.campus_id = ?")
    .all(campusId) as Array<{ project_id: string; course_id: string }>) {
    rawProjectCourses.set(row.project_id, [...(rawProjectCourses.get(row.project_id) ?? []), row.course_id]);
  }

  const projects: ProjectRow[] = [];
  const projectTeachers = new Map<string, string[]>();
  const projectCourses = new Map<string, string[]>();
  const canonicalProjectByKey = new Map<string, ProjectRow>();
  let duplicateProjectRows = 0;
  for (const project of rawProjects) {
    const courseIds = [...new Set(rawProjectCourses.get(project.id) ?? [])].sort();
    const key = [
      project.name.trim().toLowerCase(),
      project.type,
      project.fixed_time_block_id ?? "",
      project.weekly_blocks_required,
      project.flexible,
      courseIds.join(",")
    ].join("|");
    const existing = canonicalProjectByKey.get(key);
    if (!existing) {
      canonicalProjectByKey.set(key, project);
      projects.push(project);
      projectCourses.set(project.id, courseIds);
      projectTeachers.set(project.id, [...new Set(rawProjectTeachers.get(project.id) ?? [])].sort());
      continue;
    }
    duplicateProjectRows += 1;
    const mergedTeachers = new Set([...(projectTeachers.get(existing.id) ?? []), ...(rawProjectTeachers.get(project.id) ?? [])]);
    const mergedCourses = new Set([...(projectCourses.get(existing.id) ?? []), ...courseIds]);
    projectTeachers.set(existing.id, [...mergedTeachers].sort());
    projectCourses.set(existing.id, [...mergedCourses].sort());
  }
  if (duplicateProjectRows > 0) {
    console.log("[scheduler] duplicate project rows merged", {
      campusId,
      rawProjects: rawProjects.length,
      canonicalProjects: projects.length,
      duplicateProjectRows
    });
  }

  return {
    courses,
    subjectsById: new Map(subjects.map((subject) => [subject.id, subject])),
    teachers,
    teachersById: new Map(teachers.map((teacher) => [teacher.id, teacher])),
    timeBlocks,
    assignable,
    blocksById: new Map(timeBlocks.map((block) => [block.id, block])),
    requirements,
    forced,
    projects,
    teacherAvailable,
    teacherUnavailable,
    courseAvailable,
    matrix,
    legacySubjects,
    legacyCourses,
    projectTeachers,
    projectCourses
  };
}

function buildRequirementDiagnostic(input: {
  req: RequirementRow;
  teachers: TeacherRow[];
  assignable: TimeBlockRow[];
  teacherEnabledFor: (teacherId: string, subjectId: string, courseId: string) => boolean;
  teacherAvailableAt: (teacherId: string, blockId: string) => boolean;
  courseAvailableAt: (courseId: string, blockId: string) => boolean;
  teacherBusy: Set<string>;
  courseBusy: Set<string>;
  teacherCanTakeMore: (teacherId: string) => boolean;
  blocksById: Map<string, TimeBlockRow>;
  planned: PlannedAssignment[];
  teachersById: Map<string, TeacherRow>;
  subjectsById: Map<string, SubjectRow>;
  coursesById: Map<string, CourseRow>;
}): TechnicalDiagnostic {
  const eligible = input.teachers.filter((teacher) => input.teacherEnabledFor(teacher.id, input.req.subject_id, input.req.course_id));
  const rejectedByReason: Record<string, number> = {};
  let validBeforeConflicts = 0;
  let candidatesConsidered = 0;
  const freeCourseBlocks = new Set<string>();
  const commonAvailableBlocks = new Set<string>();
  const blockingAssignments = new Set<string>();
  const reject = (reason: string) => { rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + 1; };

  if (eligible.length === 0) {
    reject("teacher_not_eligible");
  }
  for (const teacher of eligible) {
    for (const block of input.assignable) {
      candidatesConsidered += 1;
      if (!block.is_assignable || block.type !== "CLASS") { reject("break_block"); continue; }
      if (!input.teacherAvailableAt(teacher.id, block.id)) { reject("teacher_unavailable"); continue; }
      if (!input.courseAvailableAt(input.req.course_id, block.id)) { reject("course_unavailable"); continue; }
      validBeforeConflicts += 1;
      if (!input.courseBusy.has(`${input.req.course_id}|${block.id}`)) freeCourseBlocks.add(formatBlock(block));
      commonAvailableBlocks.add(`${formatBlock(block)} (${teacher.full_name})`);
      if (input.teacherBusy.has(`${teacher.id}|${block.id}`)) {
        reject("teacher_already_assigned");
        const blocker = input.planned.find((assignment) => assignment.teacher_id === teacher.id && assignment.time_block_id === block.id);
        if (blocker) blockingAssignments.add(formatBlockingAssignment(blocker, input));
        continue;
      }
      if (input.courseBusy.has(`${input.req.course_id}|${block.id}`)) {
        reject("course_already_assigned");
        const blocker = input.planned.find((assignment) => assignment.course_id === input.req.course_id && assignment.time_block_id === block.id);
        if (blocker) blockingAssignments.add(formatBlockingAssignment(blocker, input));
        continue;
      }
      if (!input.teacherCanTakeMore(teacher.id)) { reject("exceeds_contractual_load"); continue; }
    }
  }
  return {
    course: input.req.course_name,
    subject: input.req.subject_name,
    candidatesConsidered,
    eligibleTeachers: eligible.map((teacher) => teacher.full_name),
    validTimeBlocksBeforeConflicts: validBeforeConflicts,
    rejectedByReason,
    freeCourseBlocks: [...freeCourseBlocks].slice(0, 12),
    commonAvailableBlocks: [...commonAvailableBlocks].slice(0, 12),
    blockingAssignments: [...blockingAssignments].slice(0, 12)
  };
}

function formatBlock(block: TimeBlockRow) {
  const days = ["Lun", "Mar", "Mie", "Jue", "Vie"];
  return `${days[block.day_of_week] ?? block.day_of_week} B${block.block_index}`;
}

function formatBlockingAssignment(assignment: PlannedAssignment, input: {
  blocksById: Map<string, TimeBlockRow>;
  teachersById: Map<string, TeacherRow>;
  subjectsById: Map<string, SubjectRow>;
  coursesById: Map<string, CourseRow>;
}) {
  const block = input.blocksById.get(assignment.time_block_id);
  const subject = assignment.subject_id ? input.subjectsById.get(assignment.subject_id)?.name : assignment.title;
  const course = assignment.course_id ? input.coursesById.get(assignment.course_id)?.name : "sin curso";
  const teacher = assignment.teacher_id ? input.teachersById.get(assignment.teacher_id)?.full_name : "sin docente";
  const forced = assignment.forced ? "forzada" : "movible";
  return `${block ? formatBlock(block) : assignment.time_block_id}: ${subject ?? assignment.assignment_type} en ${course} con ${teacher} (${forced})`;
}

function buildReadableSuggestion(req: RequirementRow, assigned: number, missing: number, diag: TechnicalDiagnostic) {
  const teachers = diag.eligibleTeachers.length ? diag.eligibleTeachers.join(", ") : "sin docentes habilitados";
  const mainReason = Object.entries(diag.rejectedByReason).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "no_time_block";
  const reasonText: Record<string, string> = {
    teacher_unavailable: "los docentes habilitados no tienen disponibilidad compatible",
    course_unavailable: "el curso no tiene disponibilidad compatible",
    teacher_already_assigned: "los docentes habilitados ya quedaron ocupados en esos bloques",
    course_already_assigned: "el curso ya quedo ocupado en los bloques compatibles",
    exceeds_contractual_load: "los docentes habilitados ya completaron su carga contractual",
    teacher_not_eligible: "no hay docentes habilitados para esa combinacion",
    no_time_block: "no hay bloques compatibles"
  };
  return [
    `Requeridos: ${req.weekly_blocks_required}. Asignados: ${assigned}. Pendientes: ${missing}.`,
    `Docentes habilitados: ${teachers}.`,
    diag.freeCourseBlocks?.length ? `Bloques libres del curso: ${diag.freeCourseBlocks.join(", ")}.` : "El curso no tiene bloques libres compatibles.",
    diag.commonAvailableBlocks?.length ? `Coincidencias docente/curso antes de conflictos: ${diag.commonAvailableBlocks.join(", ")}.` : "No hay coincidencias libres entre docente y curso.",
    diag.blockingAssignments?.length ? `Asignaciones bloqueantes: ${diag.blockingAssignments.join(" / ")}.` : "",
    `Razon principal: ${reasonText[mainReason] ?? mainReason}.`,
    "Sugerencias: ampliar disponibilidad, habilitar otro docente, liberar una asignacion previa o forzar manualmente si corresponde."
  ].filter(Boolean).join(" ");
}

function materializeEntries(planned: PlannedAssignment[], data: ReturnType<typeof loadSchedulerData>, versionId: string): ScheduleAssignmentRow[] {
  return planned
    .map((assignment) => {
      const block = data.blocksById.get(assignment.time_block_id);
      if (!block) return null;
      const course = assignment.course_id ? data.courses.find((item) => item.id === assignment.course_id) : null;
      const subject = assignment.subject_id ? data.subjectsById.get(assignment.subject_id) : null;
      const teacher = assignment.teacher_id ? data.teachersById.get(assignment.teacher_id) : null;
      return {
        ...assignment,
        schedule_version_id: versionId,
        day_of_week: block.day_of_week,
        block_index: block.block_index,
        start_time: block.start_time,
        end_time: block.end_time,
        course_name: course?.name ?? null,
        subject_name: subject?.name ?? (assignment.assignment_type === "INSTITUTIONAL_HOUR" ? "Hora institucional" : assignment.title),
        subject_color: subject?.color ?? (assignment.assignment_type === "INSTITUTIONAL_HOUR" ? "#94a3b8" : PROJECT_COLOR),
        teacher_name: teacher?.full_name ?? null
      };
    })
    .filter(Boolean) as ScheduleAssignmentRow[];
}

function persistGeneration(campusId: string, versionId: string, status: GenerationStatus, planned: PlannedAssignment[], conflicts: GenerationConflict[]) {
  const db = getDb();
  const now = nowIso();
  const finalStatus: ScheduleVersionStatus =
    status === "SUCCESS" ? "COMPLETED" :
    status === "FAILED_TIMEOUT" ? "FAILED_TIMEOUT" :
    status === "PARTIAL" ? "PARTIAL" :
    "FAILED_ERROR";
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO schedule_versions (id, campus_id, name, status, generated_at, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?)`
    ).run(versionId, campusId, `Generacion ${new Date().toLocaleString("es-AR")}`, "GENERATING", now, now, now);

    if (status === "SUCCESS" || status === "PARTIAL") {
      const insertAssignment = db.prepare(
        `INSERT INTO schedule_assignments
         (id, schedule_version_id, campus_id, course_id, subject_id, teacher_id, time_block_id, assignment_type, title, forced, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      );
      for (const assignment of planned) {
        insertAssignment.run(
          assignment.id,
          versionId,
          campusId,
          assignment.course_id,
          assignment.subject_id,
          assignment.teacher_id,
          assignment.time_block_id,
          assignment.assignment_type,
          assignment.title,
          assignment.forced,
          now,
          now
        );
      }
    }

    const insertConflict = db.prepare(
      `INSERT INTO conflicts (id, campus_id, schedule_version_id, type, severity, message, suggestion, entity_type, entity_id, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    );
    for (const conflict of conflicts) {
      insertConflict.run(
        newId("cfl"),
        campusId,
        versionId,
        conflict.type,
        conflict.severity,
        conflict.message,
        conflict.suggestion ?? null,
        conflict.entity_type ?? null,
        conflict.entity_id ?? null,
        now
      );
    }

    db.prepare("UPDATE schedule_versions SET status = ?, updated_at = ? WHERE id = ?").run(finalStatus, now, versionId);
  });
  tx();
  return versionId;
}

function markStaleGeneratingVersions(campusId: string) {
  const db = getDb();
  db.prepare("UPDATE schedule_versions SET status = 'COMPLETED', updated_at = ? WHERE campus_id = ? AND status = 'SUCCESS'")
    .run(nowIso(), campusId);
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  db.prepare("UPDATE schedule_versions SET status = 'FAILED', updated_at = ? WHERE campus_id = ? AND status = 'GENERATING' AND created_at < ?")
    .run(nowIso(), campusId, cutoff);
}

function loadEntriesForVersion(versionId: string): ScheduleAssignmentRow[] {
  return getDb()
    .prepare(
      `SELECT sa.*, COALESCE(tb.day_of_week, -1) AS day_of_week,
              COALESCE(tb.block_index, -1) AS block_index,
              COALESCE(tb.start_time, '') AS start_time,
              COALESCE(tb.end_time, '') AS end_time,
              c.name AS course_name,
              s.name AS subject_name,
              COALESCE(s.color, CASE WHEN sa.assignment_type = 'INSTITUTIONAL_HOUR' THEN '#94a3b8' ELSE '${PROJECT_COLOR}' END) AS subject_color,
              t.full_name AS teacher_name
       FROM schedule_assignments sa
       LEFT JOIN time_blocks tb ON tb.id = sa.time_block_id
       LEFT JOIN courses c ON c.id = sa.course_id
       LEFT JOIN subjects s ON s.id = sa.subject_id
       LEFT JOIN teachers t ON t.id = sa.teacher_id
       WHERE sa.schedule_version_id = ?
       ORDER BY tb.day_of_week, tb.start_time`
    )
    .all(versionId)
    .filter((row: any) => row.day_of_week >= 0 && row.time_block_id) as ScheduleAssignmentRow[];
}
