import { classrooms, courseSubjects, courses, subjects, teachers } from "@/lib/demo-data";

export type OptimizerPayload = {
  days: number;
  slotsPerDay: number;
  teachers: typeof teachers;
  courses: typeof courses;
  subjects: typeof subjects;
  classrooms: typeof classrooms;
  requirements: typeof courseSubjects;
};

export function buildOptimizerPayload(): OptimizerPayload {
  return {
    days: 5,
    slotsPerDay: 8,
    teachers,
    courses,
    subjects,
    classrooms,
    requirements: courseSubjects
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

export function validateMove(day: number, slot: number) {
  if (day < 0 || day > 4 || slot < 0 || slot > 7) {
    return {
      valid: false,
      conflicts: ["The selected target is outside the weekly timetable."]
    };
  }

  if (day === 2 && slot === 6) {
    return {
      valid: false,
      conflicts: ["Ana Martinez is unavailable on Wednesday at 13:10."]
    };
  }

  return {
    valid: true,
    conflicts: []
  };
}
