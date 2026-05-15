import {
  assignableBlocks,
  classrooms,
  conflicts,
  courseSubjects,
  courses,
  customConditions,
  defaultCampusId,
  programBlocks,
  subjects,
  teachers,
  timeBlocks
} from "@/lib/demo-data";

export type OptimizerPayload = {
  days: number;
  campusId: string;
  timeBlocks: typeof timeBlocks;
  assignableBlocks: typeof assignableBlocks;
  teachers: typeof teachers;
  courses: typeof courses;
  subjects: typeof subjects;
  classrooms: typeof classrooms;
  requirements: typeof courseSubjects;
  programBlocks: typeof programBlocks;
  customConditions: typeof customConditions;
};

export function buildOptimizerPayload(campusId = defaultCampusId): OptimizerPayload {
  return {
    days: 5,
    campusId,
    timeBlocks,
    assignableBlocks,
    teachers: teachers.filter((teacher) => teacher.campusId === campusId),
    courses: courses.filter((course) => course.campusId === campusId),
    subjects,
    classrooms: classrooms.filter((classroom) => classroom.campusId === campusId),
    requirements: courseSubjects.filter((requirement) => requirement.campusId === campusId),
    programBlocks: programBlocks.filter((block) => block.campusId === campusId),
    customConditions: customConditions.filter((condition) => condition.campusId === campusId)
  };
}

export async function callOptimizer(payload: OptimizerPayload) {
  const url = process.env.OPTIMIZER_URL ?? "http://localhost:8000";
  const response = await fetch(`${url}/solve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Optimizer failed with ${response.status}`);
  }

  return response.json();
}

const validBlockIndices = new Set(assignableBlocks.map((block) => block.blockIndex));

export function validateMove(day: number, blockIndex: number, campusId = defaultCampusId, entryId?: string) {
  if (day < 0 || day > 4 || !validBlockIndices.has(blockIndex)) {
    return {
      valid: false,
      conflicts: ["El bloque seleccionado está fuera de la grilla semanal."],
      suggestions: ["Elegí un día entre lunes y viernes.", "Seleccioná un bloque horario asignable."]
    };
  }

  const teacherUnavailable = teachers.find((teacher) =>
    teacher.campusId === campusId &&
    teacher.unavailable.some(([d, b]) => d === day && b === blockIndex)
  );
  if (teacherUnavailable && entryId) {
    return {
      valid: false,
      conflicts: [`${teacherUnavailable.fullName} figura como no disponible en ese bloque.`],
      suggestions: ["Cambiá la disponibilidad docente.", "Mové la clase a otro bloque.", "Asigná un docente alternativo."]
    };
  }

  if (entryId === "s7" && day === 3 && blockIndex === 3) {
    return {
      valid: false,
      conflicts: ["El Taller Maker ya está ocupado en ese bloque."],
      suggestions: ["Usá otra sala especial compatible.", "Mové la electiva a otro bloque.", "Coordiná con la otra electiva."]
    };
  }

  return {
    valid: true,
    conflicts: [],
    suggestions: []
  };
}

export function explainGenerationConflicts(campusId = defaultCampusId) {
  return conflicts
    .filter((conflict) => conflict.campusId === campusId)
    .map((conflict) => ({
      id: conflict.id,
      severity: conflict.severity,
      message: conflict.messageEs,
      suggestions: conflict.suggestionsEs
    }));
}
