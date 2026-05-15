export const days = ["Lun", "Mar", "Mie", "Jue", "Vie"];
export const daysEn = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const slots = ["08:00", "08:45", "09:40", "10:25", "11:20", "12:05", "13:10", "13:55"];

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

export const teachers = [
  {
    id: "t-ana",
    campusId: "campus-nordelta",
    fullName: "Ana Perez",
    email: "ana.perez@northfield.demo",
    subjects: ["Matematica", "Fisica"],
    weeklyMaxModules: 26,
    preferences: "Prefiere bloques dobles antes del almuerzo.",
    blocked: [
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
    weeklyMaxModules: 24,
    preferences: "No puede trabajar primera hora los lunes.",
    blocked: [[0, 0]]
  },
  {
    id: "t-laura",
    campusId: "campus-nordelta",
    fullName: "Laura Fernandez",
    email: "laura.fernandez@northfield.demo",
    subjects: ["Ciudadanos", "Historia"],
    weeklyMaxModules: 22,
    preferences: "Coordina proyectos interdisciplinarios.",
    blocked: [
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
    weeklyMaxModules: 20,
    preferences: "Mejor disponibilidad de martes a viernes.",
    blocked: [
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
    weeklyMaxModules: 21,
    preferences: "Ciudadanos debe coincidir con Laura.",
    blocked: [
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
    weeklyMaxModules: 25,
    preferences: "Practicas en sala de informatica.",
    blocked: [[3, 0]]
  },
  {
    id: "t-pablo",
    campusId: "campus-puertos",
    fullName: "Pablo Leon",
    email: "pablo.leon@northfield.demo",
    subjects: ["Tecnologia", "Arte"],
    weeklyMaxModules: 18,
    preferences: "Puede viajar entre sedes con 45 minutos de transicion.",
    blocked: [
      [4, 6],
      [4, 7]
    ]
  }
];

export const courses = [
  { id: "1a-nor", campusId: "campus-nordelta", label: "1A", year: 1, division: "A", studentCount: 28 },
  { id: "1b-nor", campusId: "campus-nordelta", label: "1B", year: 1, division: "B", studentCount: 31 },
  { id: "2a-nor", campusId: "campus-nordelta", label: "2A", year: 2, division: "A", studentCount: 26 },
  { id: "1a-pue", campusId: "campus-puertos", label: "1A", year: 1, division: "A", studentCount: 27 },
  { id: "2b-pue", campusId: "campus-puertos", label: "2B", year: 2, division: "B", studentCount: 29 }
];

export const courseSubjects = [
  { campusId: "campus-nordelta", course: "1A", subject: "Matematica", weeklyModules: 5, distribution: "2 + 2 + 1" },
  { campusId: "campus-nordelta", course: "1A", subject: "Lengua", weeklyModules: 4, distribution: "2 + 1 + 1" },
  { campusId: "campus-nordelta", course: "1B", subject: "Matematica", weeklyModules: 5, distribution: "2 + 2 + 1" },
  { campusId: "campus-nordelta", course: "1B", subject: "Ingles", weeklyModules: 3, distribution: "1 + 1 + 1" },
  { campusId: "campus-nordelta", course: "2A", subject: "Fisica", weeklyModules: 4, distribution: "2 + 2" },
  { campusId: "campus-nordelta", course: "2A", subject: "Tecnologia", weeklyModules: 3, distribution: "2 + 1" },
  { campusId: "campus-puertos", course: "1A", subject: "Biologia", weeklyModules: 3, distribution: "2 + 1" },
  { campusId: "campus-puertos", course: "1A", subject: "Matematica", weeklyModules: 5, distribution: "2 + 2 + 1" },
  { campusId: "campus-puertos", course: "2B", subject: "Historia", weeklyModules: 3, distribution: "2 + 1" },
  { campusId: "campus-puertos", course: "2B", subject: "Arte", weeklyModules: 2, distribution: "2" },
  { campusId: "campus-puertos", course: "2B", subject: "Tecnologia", weeklyModules: 3, distribution: "2 + 1" }
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
    involvedCourses: ["1A", "1B"],
    requiredRoomType: "REGULAR",
    preferredClassroom: "Aula 204",
    weeklyModules: 2,
    requiresSameTimeTeachers: true,
    requiresSameTimeCourses: true,
    fixedDay: null,
    fixedTimeSlot: null,
    priority: "CRITICAL",
    notes: "Caso conflictivo: ambas docentes bloquean varios espacios comunes."
  },
  {
    id: "pb-electiva-tech",
    campusId: "campus-puertos",
    name: "Electiva de Tecnologia",
    type: "ELECTIVE",
    description: "Electiva compartida entre 1A y 2B en sala de informatica o maker.",
    requiredTeachers: ["Mariana Lopez", "Pablo Leon"],
    involvedCourses: ["1A", "2B"],
    requiredRoomType: "MAKER_ROOM",
    preferredClassroom: "Taller Maker",
    weeklyModules: 2,
    requiresSameTimeTeachers: true,
    requiresSameTimeCourses: true,
    fixedDay: null,
    fixedTimeSlot: null,
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
    involvedCourses: ["2B"],
    requiredRoomType: "SPECIAL",
    preferredClassroom: "Estudio de Arte",
    weeklyModules: 2,
    requiresSameTimeTeachers: false,
    requiresSameTimeCourses: false,
    fixedDay: 4,
    fixedTimeSlot: 4,
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
    involvedCourses: ["1A"],
    requiredRoomType: "MAKER_ROOM",
    preferredClassroom: "Taller Maker",
    weeklyModules: 2,
    requiresSameTimeTeachers: false,
    requiresSameTimeCourses: false,
    fixedDay: null,
    fixedTimeSlot: null,
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
    involvedCourses: ["2A"],
    requiredRoomType: "LABORATORY",
    preferredClassroom: "Laboratorio A",
    weeklyModules: 2,
    requiresSameTimeTeachers: true,
    requiresSameTimeCourses: false,
    fixedDay: 2,
    fixedTimeSlot: 1,
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
    conditionType: "MAX_MODULES_PER_DAY",
    operator: "LESS_THAN_OR_EQUAL",
    value: { modules: 6 },
    priority: "HIGH",
    isHardConstraint: true,
    description: "Ana Perez no puede tener mas de 6 modulos por dia."
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

export const scheduleEntries = [
  { id: "s1", campusId: "campus-nordelta", day: 0, slot: 0, course: "1A", subject: "Matematica", teacher: "Ana Perez", classroom: "Aula 101", color: "#FDBA74", kind: "REGULAR" },
  { id: "s2", campusId: "campus-nordelta", day: 0, slot: 1, course: "1A", subject: "Matematica", teacher: "Ana Perez", classroom: "Aula 101", color: "#FDBA74", kind: "REGULAR" },
  { id: "s3", campusId: "campus-nordelta", day: 0, slot: 2, course: "1B", subject: "Ingles", teacher: "Carlos Gomez", classroom: "Aula 204", color: "#fb7185", kind: "REGULAR" },
  { id: "s4", campusId: "campus-nordelta", day: 2, slot: 1, course: "2A", subject: "Proyecto Interdisciplinario", teacher: "Ana Perez + Laura Fernandez", classroom: "Laboratorio A", color: "#86EFAC", kind: "INTERDISCIPLINARY" },
  { id: "s5", campusId: "campus-puertos", day: 1, slot: 1, course: "1A", subject: "Biologia", teacher: "Mariana Lopez", classroom: "Aula Puertos 101", color: "#A7C957", kind: "REGULAR" },
  { id: "s6", campusId: "campus-puertos", day: 2, slot: 3, course: "2B", subject: "Historia", teacher: "Diego Martinez", classroom: "Aula Puertos 101", color: "#f59e0b", kind: "REGULAR" },
  { id: "s7", campusId: "campus-puertos", day: 3, slot: 2, course: "1A + 2B", subject: "Electiva de Tecnologia", teacher: "Mariana Lopez + Pablo Leon", classroom: "Taller Maker", color: "#86EFAC", kind: "ELECTIVE" },
  { id: "s8", campusId: "campus-puertos", day: 4, slot: 4, course: "2B", subject: "Optativa de Arte", teacher: "Diego Martinez + Pablo Leon", classroom: "Estudio de Arte", color: "#c084fc", kind: "OPTATIVE" }
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
    "Sala de Informatica,Jueves,09:40,10:25,2A,Tecnologia,Mariana Lopez,Northfield Puertos"
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
    id: "conf-ciudadanos",
    campusId: "campus-nordelta",
    severity: "HIGH",
    title: "Ciudadanos sin disponibilidad comun",
    messageEs: "No se pudo asignar Ciudadanos porque los docentes requeridos no tienen una disponibilidad comun suficiente.",
    messageEn: "Ciudadanos could not be scheduled because the required teachers do not share enough common available time slots.",
    suggestionsEs: ["Agregar disponibilidad docente.", "Permitir otra ventana horaria.", "Asignar un docente alternativo."],
    suggestionsEn: ["Add more teacher availability.", "Allow another time window.", "Assign an alternative teacher."]
  },
  {
    id: "conf-tech-room",
    campusId: "campus-puertos",
    severity: "MEDIUM",
    title: "Sala compatible ocupada",
    messageEs: "La Sala de Informatica ya esta ocupada en ese bloque para Tecnologia.",
    messageEn: "The computer room is already occupied in that time slot for Technology.",
    suggestionsEs: ["Usar otra aula compatible.", "Mover la electiva a otro bloque.", "Habilitar el Taller Maker."],
    suggestionsEn: ["Use another compatible room.", "Move the elective to another block.", "Enable the Maker room."]
  }
];

export const insights = [
  "Mover Matematica de 2A del martes al jueves elimina una ventana docente.",
  "Ciudadanos necesita una disponibilidad comun adicional entre Laura Fernandez y Vanina Gerstner.",
  "La Electiva de Tecnologia queda mejor en bloque doble en Taller Maker.",
  "La sede Puertos requiere 45 minutos de transicion para docentes compartidos."
];

export function byCampus<T extends { campusId?: string | null }>(items: T[], campusId: string) {
  return items.filter((item) => item.campusId === campusId || item.campusId === null);
}

export const defaultCampusId = "campus-nordelta";
