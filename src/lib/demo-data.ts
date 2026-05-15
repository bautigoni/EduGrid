export const days = ["Lun", "Mar", "Mié", "Jue", "Vie"];
export const daysEn = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export type TimeBlockType = "CLASS" | "BREAK" | "MINI_BREAK" | "LUNCH";

export type TimeBlock = {
  blockIndex: number | null;
  label: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: TimeBlockType;
  isAssignable: boolean;
  breakLabel?: string;
};

export const timeBlocks: TimeBlock[] = [
  { blockIndex: 1, label: "08:15 - 09:15", startTime: "08:15", endTime: "09:15", durationMinutes: 60, type: "CLASS", isAssignable: true },
  { blockIndex: 2, label: "09:15 - 10:15", startTime: "09:15", endTime: "10:15", durationMinutes: 60, type: "CLASS", isAssignable: true },
  { blockIndex: null, label: "10:15 - 10:30", startTime: "10:15", endTime: "10:30", durationMinutes: 15, type: "BREAK", isAssignable: false, breakLabel: "Recreo" },
  { blockIndex: 3, label: "10:30 - 11:35", startTime: "10:30", endTime: "11:35", durationMinutes: 65, type: "CLASS", isAssignable: true },
  { blockIndex: null, label: "11:35 - 11:40", startTime: "11:35", endTime: "11:40", durationMinutes: 5, type: "MINI_BREAK", isAssignable: false, breakLabel: "Mini break" },
  { blockIndex: 4, label: "11:40 - 12:40", startTime: "11:40", endTime: "12:40", durationMinutes: 60, type: "CLASS", isAssignable: true },
  { blockIndex: null, label: "12:40 - 13:25", startTime: "12:40", endTime: "13:25", durationMinutes: 45, type: "LUNCH", isAssignable: false, breakLabel: "Comida y recreo" },
  { blockIndex: 5, label: "13:25 - 14:15", startTime: "13:25", endTime: "14:15", durationMinutes: 50, type: "CLASS", isAssignable: true },
  { blockIndex: 6, label: "14:15 - 15:15", startTime: "14:15", endTime: "15:15", durationMinutes: 60, type: "CLASS", isAssignable: true },
  { blockIndex: null, label: "15:15 - 15:30", startTime: "15:15", endTime: "15:30", durationMinutes: 15, type: "BREAK", isAssignable: false, breakLabel: "Recreo" },
  { blockIndex: 7, label: "15:30 - 16:30", startTime: "15:30", endTime: "16:30", durationMinutes: 60, type: "CLASS", isAssignable: true }
];

export const assignableBlocks = timeBlocks.filter((block) => block.isAssignable);
export const slots = assignableBlocks.map((block) => block.startTime);
export const blockDurations = assignableBlocks.map((block) => block.durationMinutes);
export const totalAssignableMinutesPerDay = blockDurations.reduce((sum, value) => sum + value, 0);

export function blockIndexToSlot(blockIndex: number) {
  return assignableBlocks.findIndex((block) => block.blockIndex === blockIndex);
}

export function slotToBlockIndex(slot: number) {
  return assignableBlocks[slot]?.blockIndex ?? null;
}

export function formatHoursAndMinutes(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "0 h";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
}

export const campuses = [
  {
    id: "campus-nordelta",
    name: "Northfield Nordelta",
    address: "Av. de los Lagos 4100",
    city: "Tigre",
    province: "Buenos Aires",
    country: "Argentina",
    code: "NFD-NOR",
    isActive: true
  },
  {
    id: "campus-puertos",
    name: "Northfield Puertos",
    address: "Av. de los Colegios 1850",
    city: "Escobar",
    province: "Buenos Aires",
    country: "Argentina",
    code: "NFD-PUE",
    isActive: true
  }
];

export const demoUsers = [
  {
    id: "user-superadmin",
    name: "Sofia Robles",
    email: "admin@horaria.demo",
    role: "SUPERADMIN",
    status: "ACTIVE",
    campusIds: campuses.map((campus) => campus.id),
    selectedCampusId: "campus-nordelta",
    createdAt: "2026-04-20"
  },
  {
    id: "user-campus-admin",
    name: "Vanina Gerstner",
    email: "vanina@northfield.demo",
    role: "CAMPUS_ADMIN",
    status: "ACTIVE",
    campusIds: ["campus-nordelta"],
    selectedCampusId: "campus-nordelta",
    createdAt: "2026-04-25"
  },
  {
    id: "user-scheduler",
    name: "Mariana Lopez",
    email: "mariana@northfield.demo",
    role: "SCHEDULER",
    status: "ACTIVE",
    campusIds: ["campus-puertos"],
    selectedCampusId: "campus-puertos",
    createdAt: "2026-04-28"
  },
  {
    id: "user-viewer-nordelta",
    name: "Carlos Gomez",
    email: "viewer.nordelta@horaria.demo",
    role: "VIEWER",
    status: "ACTIVE",
    campusIds: ["campus-nordelta"],
    selectedCampusId: "campus-nordelta",
    createdAt: "2026-05-01"
  },
  {
    id: "user-multi-campus-admin",
    name: "Laura Fernandez",
    email: "coordinacion@horaria.demo",
    role: "CAMPUS_ADMIN",
    status: "ACTIVE",
    campusIds: ["campus-nordelta", "campus-puertos"],
    selectedCampusId: "campus-nordelta",
    createdAt: "2026-05-03"
  },
  {
    id: "user-pending",
    name: "Pablo Leon",
    email: "pablo@northfield.demo",
    role: "SCHEDULER",
    status: "PENDING_APPROVAL",
    campusIds: [],
    selectedCampusId: null,
    createdAt: "2026-05-11"
  }
];

// Invitation codes are how the registration flow assigns campus + role.
// Never expose campus names before validating the code.
export const invitationCodes = [
  {
    id: "code-superadmin",
    code: "HORARIA-SUPERADMIN-2026",
    campusId: null,
    role: "SUPERADMIN",
    label: "Superadmin (demo)",
    isActive: true,
    expiresAt: null as string | null,
    maxUses: null as number | null,
    usedCount: 0,
    requiresApproval: false,
    createdAt: "2026-01-01"
  },
  {
    id: "code-puertos",
    code: "PUERTOS-HORARIOS-2026",
    campusId: "campus-puertos",
    role: "COORDINADOR_HORARIOS",
    label: "Coordinación Northfield Puertos",
    isActive: true,
    expiresAt: null as string | null,
    maxUses: null as number | null,
    usedCount: 1,
    requiresApproval: false,
    createdAt: "2026-01-01"
  },
  {
    id: "code-nordelta",
    code: "NORDELTA-HORARIOS-2026",
    campusId: "campus-nordelta",
    role: "COORDINADOR_HORARIOS",
    label: "Coordinación Northfield Nordelta",
    isActive: true,
    expiresAt: null as string | null,
    maxUses: null as number | null,
    usedCount: 1,
    requiresApproval: false,
    createdAt: "2026-01-01"
  }
];

export const registrationRequests = [
  {
    id: "request-pablo",
    userId: "user-pending",
    fullName: "Pablo Leon",
    email: "pablo@northfield.demo",
    institutionName: "Northfield School",
    requestedCampus: "Northfield Puertos",
    campusId: "campus-puertos",
    requestedRole: "SCHEDULER",
    message: "Necesito cargar optativas y revisar disponibilidad docente para secundaria.",
    status: "PENDING_APPROVAL",
    createdAt: "2026-05-11"
  },
  {
    id: "request-laura",
    userId: "user-laura-request",
    fullName: "Laura Fernandez",
    email: "laura.coordinacion@northfield.demo",
    institutionName: "Northfield School",
    requestedCampus: "Northfield Nordelta",
    campusId: "campus-nordelta",
    requestedRole: "CAMPUS_ADMIN",
    message: "Coordinacion academica de proyectos interdisciplinarios.",
    status: "PENDING_APPROVAL",
    createdAt: "2026-05-14"
  }
];

export const subjects = [
  { id: "math", campusId: null, name: "Matematica", code: "MAT", color: "#FDBA74", roomType: "REGULAR", isGlobal: true },
  { id: "literature", campusId: null, name: "Lengua", code: "LEN", color: "#F4A261", roomType: "REGULAR", isGlobal: true },
  { id: "physics", campusId: null, name: "Fisica", code: "FIS", color: "#60a5fa", roomType: "LABORATORY", isGlobal: true },
  { id: "history", campusId: null, name: "Historia", code: "HIS", color: "#f59e0b", roomType: "REGULAR", isGlobal: true },
  { id: "biology", campusId: null, name: "Biologia", code: "BIO", color: "#A7C957", roomType: "LABORATORY", isGlobal: true },
  { id: "technology", campusId: null, name: "Tecnologia", code: "TEC", color: "#86EFAC", roomType: "COMPUTER_ROOM", isGlobal: true },
  { id: "english", campusId: null, name: "Ingles", code: "ING", color: "#fb7185", roomType: "REGULAR", isGlobal: true },
  { id: "art", campusId: null, name: "Arte", code: "ART", color: "#c084fc", roomType: "SPECIAL", isGlobal: true },
  { id: "citizenship", campusId: null, name: "Ciudadanos", code: "CIU", color: "#f97316", roomType: "REGULAR", isGlobal: true }
];

// Teacher availability stored as [day(0-4), blockIndex(1-7)] pairs that are NO disponible.
export const teachers = [
  {
    id: "t-ana",
    campusId: "campus-nordelta",
    fullName: "Ana Perez",
    email: "ana.perez@northfield.demo",
    subjects: ["Matematica", "Fisica"],
    contractualHours: 26,
    allowInstitutionalHours: true,
    eligibleYears: [1, 2] as number[],
    eligibleCourseIds: [] as string[],
    preferences: "Prefiere bloques dobles antes del almuerzo.",
    unavailable: [
      [2, 6],
      [2, 7]
    ]
  },
  {
    id: "t-carlos",
    campusId: "campus-nordelta",
    fullName: "Carlos Gomez",
    email: "carlos.gomez@northfield.demo",
    subjects: ["Lengua", "Ingles"],
    contractualHours: 24,
    allowInstitutionalHours: true,
    eligibleYears: [] as number[],
    eligibleCourseIds: [] as string[],
    preferences: "No puede trabajar primera hora los lunes.",
    unavailable: [[0, 1]]
  },
  {
    id: "t-laura",
    campusId: "campus-nordelta",
    fullName: "Laura Fernandez",
    email: "laura.fernandez@northfield.demo",
    subjects: ["Ciudadanos", "Historia"],
    contractualHours: 22,
    allowInstitutionalHours: true,
    eligibleYears: [] as number[],
    eligibleCourseIds: [] as string[],
    preferences: "Coordina proyectos interdisciplinarios.",
    unavailable: [
      [1, 3],
      [3, 4]
    ]
  },
  {
    id: "t-diego",
    campusId: "campus-puertos",
    fullName: "Diego Martinez",
    email: "diego.martinez@northfield.demo",
    subjects: ["Historia", "Arte"],
    contractualHours: 20,
    allowInstitutionalHours: false,
    eligibleYears: [] as number[],
    eligibleCourseIds: [] as string[],
    preferences: "Mejor disponibilidad de martes a viernes.",
    unavailable: [
      [0, 5],
      [0, 6],
      [0, 7]
    ]
  },
  {
    id: "t-vanina",
    campusId: "campus-nordelta",
    fullName: "Vanina Gerstner",
    email: "vanina.gerstner@northfield.demo",
    subjects: ["Ciudadanos", "Biologia"],
    contractualHours: 21,
    allowInstitutionalHours: true,
    eligibleYears: [] as number[],
    eligibleCourseIds: [] as string[],
    preferences: "Ciudadanos debe coincidir con Laura.",
    unavailable: [
      [1, 3],
      [2, 2],
      [3, 4]
    ]
  },
  {
    id: "t-mariana",
    campusId: "campus-puertos",
    fullName: "Mariana Lopez",
    email: "mariana.lopez@northfield.demo",
    subjects: ["Tecnologia", "Matematica"],
    contractualHours: 25,
    allowInstitutionalHours: true,
    eligibleYears: [] as number[],
    eligibleCourseIds: [] as string[],
    preferences: "Practicas en sala de informatica.",
    unavailable: [[3, 1]]
  },
  {
    id: "t-pablo",
    campusId: "campus-puertos",
    fullName: "Pablo Leon",
    email: "pablo.leon@northfield.demo",
    subjects: ["Tecnologia", "Arte"],
    contractualHours: 18,
    allowInstitutionalHours: false,
    eligibleYears: [] as number[],
    eligibleCourseIds: [] as string[],
    preferences: "Puede viajar entre sedes con 45 minutos de transicion.",
    unavailable: [
      [4, 6],
      [4, 7]
    ]
  }
];

// Each course already has its own default aula, so classroom is implicit.
// Course availability is stored as [day(0-4), blockIndex(1-7)] pairs that are NO disponible.
export const courses = [
  ...campuses.flatMap((campus) =>
    [1, 2, 3, 4, 5, 6].flatMap((year) =>
      ["N", "F", "S"].map((division, index) => ({
        id: `${year}${division.toLowerCase()}-${campus.id === "campus-nordelta" ? "nor" : "pue"}`,
        campusId: campus.id,
        label: `${year}${division}`,
        year,
        division,
        studentCount: 24 + year + index,
        defaultClassroom: `Aula ${year}${division}`,
        // Primaria (1-3) no usa los dos últimos bloques
        unavailable:
          year <= 3
            ? [
                [0, 6], [0, 7],
                [1, 6], [1, 7],
                [2, 6], [2, 7],
                [3, 6], [3, 7],
                [4, 6], [4, 7]
              ]
            : []
      }))
    )
  )
];

export const courseSubjects = [
  { campusId: "campus-nordelta", course: "1N", subject: "Matematica", weeklyBlocksRequired: 5, distribution: "2 + 2 + 1" },
  { campusId: "campus-nordelta", course: "1N", subject: "Lengua", weeklyBlocksRequired: 4, distribution: "2 + 1 + 1" },
  { campusId: "campus-nordelta", course: "1F", subject: "Matematica", weeklyBlocksRequired: 5, distribution: "2 + 2 + 1" },
  { campusId: "campus-nordelta", course: "1F", subject: "Ingles", weeklyBlocksRequired: 3, distribution: "1 + 1 + 1" },
  { campusId: "campus-nordelta", course: "2N", subject: "Fisica", weeklyBlocksRequired: 4, distribution: "2 + 2" },
  { campusId: "campus-nordelta", course: "2N", subject: "Tecnologia", weeklyBlocksRequired: 3, distribution: "2 + 1" },
  { campusId: "campus-puertos", course: "1N", subject: "Biologia", weeklyBlocksRequired: 3, distribution: "2 + 1" },
  { campusId: "campus-puertos", course: "1N", subject: "Matematica", weeklyBlocksRequired: 5, distribution: "2 + 2 + 1" },
  { campusId: "campus-puertos", course: "2F", subject: "Historia", weeklyBlocksRequired: 3, distribution: "2 + 1" },
  { campusId: "campus-puertos", course: "2F", subject: "Arte", weeklyBlocksRequired: 2, distribution: "2" },
  { campusId: "campus-puertos", course: "2F", subject: "Tecnologia", weeklyBlocksRequired: 3, distribution: "2 + 1" }
];

export const classrooms = [
  { id: "r101-nor", campusId: "campus-nordelta", name: "Aula 101", type: "REGULAR", capacity: 32, restrictions: "Uso general" },
  { id: "r204-nor", campusId: "campus-nordelta", name: "Aula 204", type: "REGULAR", capacity: 36, restrictions: "Cerca del sector de ciencias" },
  { id: "lab-a-nor", campusId: "campus-nordelta", name: "Laboratorio A", type: "LABORATORY", capacity: 24, restrictions: "Ciencias naturales" },
  { id: "comp-1-nor", campusId: "campus-nordelta", name: "Sala de Informatica", type: "COMPUTER_ROOM", capacity: 30, restrictions: "Reserva obligatoria" },
  { id: "r101-pue", campusId: "campus-puertos", name: "Aula Puertos 101", type: "REGULAR", capacity: 30, restrictions: "Uso general" },
  { id: "maker-pue", campusId: "campus-puertos", name: "Taller Maker", type: "MAKER_ROOM", capacity: 24, restrictions: "Proyectos y tecnologia" },
  { id: "studio-pue", campusId: "campus-puertos", name: "Estudio de Arte", type: "SPECIAL", capacity: 22, restrictions: "Arte y optativas" }
];

export const programBlocks = [
  {
    id: "pb-ciudadanos",
    campusId: "campus-nordelta",
    name: "Ciudadanos",
    type: "CITIZENSHIP",
    description: "Proyecto de ciudadania con dos docentes simultaneos.",
    requiredTeachers: ["Laura Fernandez", "Vanina Gerstner"],
    involvedCourses: ["1N", "1F"],
    requiredRoomType: "REGULAR",
    preferredClassroom: "Aula 204",
    weeklyBlocksRequired: 2,
    requiresSameTimeTeachers: true,
    requiresSameTimeCourses: true,
    fixedDay: null,
    fixedBlockIndex: null,
    priority: "CRITICAL",
    notes: "Caso conflictivo: ambas docentes bloquean varios espacios comunes."
  },
  {
    id: "pb-electiva-tech",
    campusId: "campus-puertos",
    name: "Electiva de Tecnologia",
    type: "ELECTIVE",
    description: "Electiva compartida entre 1N y 2F en sala de informatica o maker.",
    requiredTeachers: ["Mariana Lopez", "Pablo Leon"],
    involvedCourses: ["1N", "2F"],
    requiredRoomType: "MAKER_ROOM",
    preferredClassroom: "Taller Maker",
    weeklyBlocksRequired: 2,
    requiresSameTimeTeachers: true,
    requiresSameTimeCourses: true,
    fixedDay: null,
    fixedBlockIndex: null,
    priority: "HIGH",
    notes: "Requiere coordinar dos cursos y dos docentes."
  },
  {
    id: "pb-arte",
    campusId: "campus-puertos",
    name: "Optativa de Arte",
    type: "OPTATIVE",
    description: "Optativa de arte para estudiantes de segundo ano.",
    requiredTeachers: ["Diego Martinez", "Pablo Leon"],
    involvedCourses: ["2F"],
    requiredRoomType: "SPECIAL",
    preferredClassroom: "Estudio de Arte",
    weeklyBlocksRequired: 2,
    requiresSameTimeTeachers: false,
    requiresSameTimeCourses: false,
    fixedDay: 4,
    fixedBlockIndex: 5,
    priority: "MEDIUM",
    notes: "Bloque fijo los viernes."
  },
  {
    id: "pb-maker",
    campusId: "campus-puertos",
    name: "Taller Maker",
    type: "WORKSHOP",
    description: "Taller de prototipado y tecnologia.",
    requiredTeachers: ["Mariana Lopez"],
    involvedCourses: ["1N"],
    requiredRoomType: "MAKER_ROOM",
    preferredClassroom: "Taller Maker",
    weeklyBlocksRequired: 2,
    requiresSameTimeTeachers: false,
    requiresSameTimeCourses: false,
    fixedDay: null,
    fixedBlockIndex: null,
    priority: "HIGH",
    notes: "Preferentemente en bloques consecutivos."
  },
  {
    id: "pb-inter",
    campusId: "campus-nordelta",
    name: "Proyecto Interdisciplinario",
    type: "INTERDISCIPLINARY",
    description: "Proyecto entre Matematica y Fisica.",
    requiredTeachers: ["Ana Perez", "Laura Fernandez"],
    involvedCourses: ["2N"],
    requiredRoomType: "LABORATORY",
    preferredClassroom: "Laboratorio A",
    weeklyBlocksRequired: 2,
    requiresSameTimeTeachers: true,
    requiresSameTimeCourses: false,
    fixedDay: 2,
    fixedBlockIndex: 2,
    priority: "HIGH",
    notes: "Bloque fijo para evaluacion integrada."
  }
];

export const customConditions = [
  {
    id: "cond-ana-first",
    campusId: "campus-nordelta",
    entityType: "TEACHER",
    entityId: "t-ana",
    conditionType: "MAX_BLOCKS_PER_DAY",
    operator: "LESS_THAN_OR_EQUAL",
    value: { blocks: 6 },
    priority: "HIGH",
    isHardConstraint: true,
    description: "Ana Perez no puede tener más de 6 bloques horarios por día."
  },
  {
    id: "cond-tech-room",
    campusId: "campus-puertos",
    entityType: "SUBJECT",
    entityId: "technology",
    conditionType: "REQUIRES_ROOM_TYPE",
    operator: "EQUALS",
    value: { roomType: "COMPUTER_ROOM" },
    priority: "CRITICAL",
    isHardConstraint: true,
    description: "Tecnologia requiere sala de informatica o taller maker."
  },
  {
    id: "cond-ciudadanos",
    campusId: "campus-nordelta",
    entityType: "PROGRAM_BLOCK",
    entityId: "pb-ciudadanos",
    conditionType: "REQUIRES_SAME_TIME_TEACHERS",
    operator: "EQUALS",
    value: { teachers: ["Laura Fernandez", "Vanina Gerstner"] },
    priority: "CRITICAL",
    isHardConstraint: true,
    description: "Ciudadanos requiere que Laura y Vanina coincidan en el mismo bloque."
  }
];

// blockIndex 1..7 matches the institutional time blocks defined in `timeBlocks`.
export const scheduleEntries = [
  { id: "s1", campusId: "campus-nordelta", day: 0, blockIndex: 1, course: "1N", subject: "Matematica", teacher: "Ana Perez", classroom: "Aula 1N", color: "#FDBA74", kind: "REGULAR" },
  { id: "s2", campusId: "campus-nordelta", day: 0, blockIndex: 2, course: "1N", subject: "Matematica", teacher: "Ana Perez", classroom: "Aula 1N", color: "#FDBA74", kind: "REGULAR" },
  { id: "s3", campusId: "campus-nordelta", day: 0, blockIndex: 3, course: "1F", subject: "Ingles", teacher: "Carlos Gomez", classroom: "Aula 1F", color: "#fb7185", kind: "REGULAR" },
  { id: "s4", campusId: "campus-nordelta", day: 2, blockIndex: 2, course: "2N", subject: "Proyecto Interdisciplinario", teacher: "Ana Perez + Laura Fernandez", classroom: "Laboratorio A", color: "#86EFAC", kind: "INTERDISCIPLINARY" },
  { id: "s5", campusId: "campus-puertos", day: 1, blockIndex: 2, course: "1N", subject: "Biologia", teacher: "Mariana Lopez", classroom: "Aula 1N", color: "#A7C957", kind: "REGULAR" },
  { id: "s6", campusId: "campus-puertos", day: 2, blockIndex: 4, course: "2F", subject: "Historia", teacher: "Diego Martinez", classroom: "Aula 2F", color: "#f59e0b", kind: "REGULAR" },
  { id: "s7", campusId: "campus-puertos", day: 3, blockIndex: 3, course: "1N + 2F", subject: "Electiva de Tecnologia", teacher: "Mariana Lopez + Pablo Leon", classroom: "Taller Maker", color: "#86EFAC", kind: "ELECTIVE" },
  { id: "s8", campusId: "campus-puertos", day: 4, blockIndex: 5, course: "2F", subject: "Optativa de Arte", teacher: "Diego Martinez + Pablo Leon", classroom: "Estudio de Arte", color: "#c084fc", kind: "OPTATIVE" }
];

export const importTemplates = {
  teacherAvailability: [
    "Teacher name,Email,Day,Start time,End time,Availability status,Campus,Notes",
    "Ana Perez,ana.perez@northfield.demo,Lunes,08:00,08:45,Disponible,Northfield Nordelta,Prefiere manana"
  ].join("\n"),
  courseSchedule: [
    "Course,Division,Classroom,Subject,Teacher,Day,Start time,End time,Campus",
    "1,A,Aula 101,Matematica,Ana Perez,Lunes,08:00,08:45,Northfield Nordelta"
  ].join("\n"),
  classroomSchedule: [
    "Classroom,Day,Start time,End time,Course,Subject,Teacher,Campus",
    "Sala de Informatica,Jueves,09:40,10:25,2N,Tecnologia,Mariana Lopez,Northfield Puertos"
  ].join("\n")
};

export const importBatches = [
  {
    id: "imp-availability",
    campusId: "campus-nordelta",
    type: "TEACHER_AVAILABILITY",
    status: "VALIDATED",
    filename: "disponibilidad_horaria_mayo.csv",
    rows: 42,
    validRows: 39,
    errors: 3,
    createdAt: "2026-05-10"
  },
  {
    id: "imp-course",
    campusId: "campus-puertos",
    type: "COURSE_SCHEDULE",
    status: "COMPLETED",
    filename: "horarios_cursos_trim1.csv",
    rows: 58,
    validRows: 58,
    errors: 0,
    createdAt: "2026-05-12"
  }
];

export const conflicts = [
  {
    id: "conf-no-teacher-math-1n",
    campusId: "campus-nordelta",
    severity: "HIGH",
    title: "Sin docentes para Matemática en 1N",
    messageEs: "No hay docentes disponibles para Matemática en 1N.",
    messageEn: "No teachers available for Mathematics in 1N.",
    suggestionsEs: ["Habilitá a un docente compatible.", "Asigná Matemática a un docente con años habilitados."],
    suggestionsEn: ["Enable a compatible teacher.", "Assign Mathematics to a teacher with eligible years."]
  },
  {
    id: "conf-insuficiente-biologia-2f",
    campusId: "campus-puertos",
    severity: "HIGH",
    title: "Carga insuficiente para Biología en 2F",
    messageEs: "La disponibilidad docente no alcanza para cubrir las horas de Biología en 2F.",
    messageEn: "Teacher availability is not enough to cover Biology hours in 2F.",
    suggestionsEs: ["Sumá disponibilidad a un docente compatible.", "Reducí las horas semanales de Biología."],
    suggestionsEn: ["Add availability to a compatible teacher.", "Reduce the weekly hours for Biology."]
  },
  {
    id: "conf-curso-1n-bloques",
    campusId: "campus-nordelta",
    severity: "MEDIUM",
    title: "Curso 1N sin bloques suficientes",
    messageEs: "El curso 1N no tiene suficientes bloques disponibles.",
    messageEn: "Course 1N does not have enough available blocks.",
    suggestionsEs: ["Habilitá más bloques en la disponibilidad del curso.", "Revisá las horas semanales requeridas."],
    suggestionsEn: ["Enable more blocks in the course availability.", "Review weekly required hours."]
  }
];

export const insights = [
  "Mover Matematica de 2N del martes al jueves elimina una ventana docente.",
  "Ciudadanos necesita una disponibilidad comun adicional entre Laura Fernandez y Vanina Gerstner.",
  "La Electiva de Tecnologia queda mejor en bloque doble en Taller Maker.",
  "La sede Puertos requiere 45 minutos de transicion para docentes compartidos."
];

export function byCampus<T extends { campusId?: string | null }>(items: T[], campusId: string) {
  return items.filter((item) => item.campusId === campusId || item.campusId === null);
}

export const defaultCampusId = "campus-nordelta";
