import {
  classrooms,
  conflicts,
  courseSubjects,
  courses,
  customConditions,
  defaultCampusId,
  programBlocks,
  subjects,
  teachers
} from "@/lib/demo-data";

export type OptimizerPayload = {
  days: number;
  slotsPerDay: number;
  campusId: string;
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
    slotsPerDay: 8,
    campusId,
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

export function validateMove(day: number, slot: number, campusId = defaultCampusId, entryId?: string) {
  if (day < 0 || day > 4 || slot < 0 || slot > 7) {
    return {
      valid: false,
      conflicts: ["El bloque seleccionado esta fuera de la grilla semanal."],
      suggestions: ["Elegir un dia entre lunes y viernes.", "Seleccionar un modulo disponible."]
    };
  }

  if (campusId === "campus-nordelta" && day === 2 && slot === 6) {
    return {
      valid: false,
      conflicts: ["La docente Ana Perez no puede ser asignada el miercoles a las 13:10 porque figura como no disponible."],
      suggestions: ["Agregar disponibilidad docente.", "Mover la clase a otro bloque.", "Asignar un docente alternativo."]
    };
  }

  if (entryId === "s7" && day === 3 && slot === 2) {
    return {
      valid: false,
      conflicts: ["La Sala de Informatica ya esta ocupada en ese bloque."],
      suggestions: ["Usar Taller Maker.", "Mover la electiva a otro bloque.", "Permitir aula compatible alternativa."]
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
