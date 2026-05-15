export type Locale = "es" | "en";

export const dictionary = {
  es: {
    home: "Panel",
    teachers: "Docentes",
    subjects: "Materias",
    courses: "Cursos",
    classrooms: "Aulas",
    constraints: "Restricciones",
    generate: "Generar",
    conflicts: "Conflictos",
    campuses: "Sedes",
    users: "Usuarios",
    requests: "Solicitudes",
    imports: "Importaciones",
    projects: "Proyectos",
    analytics: "Analitica",
    scheduler: "Planificador",
    settings: "Configuracion",
    logout: "Cerrar sesion",
    search: "Buscar docentes, cursos, aulas",
    filters: "Filtros",
    selectedCampus: "Sede seleccionada",
    optimizationReady: "Optimizacion lista",
    demoBalanced: "Datos demo 78% balanceados.",
    superadmin: "Superadmin"
  },
  en: {
    home: "Dashboard",
    teachers: "Teachers",
    subjects: "Subjects",
    courses: "Courses",
    classrooms: "Classrooms",
    constraints: "Constraints",
    generate: "Generate",
    conflicts: "Conflicts",
    campuses: "Campuses",
    users: "Users",
    requests: "Requests",
    imports: "Imports",
    projects: "Projects",
    analytics: "Analytics",
    scheduler: "Scheduler",
    settings: "Settings",
    logout: "Logout",
    search: "Search teachers, courses, rooms",
    filters: "Filters",
    selectedCampus: "Selected campus",
    optimizationReady: "Optimization ready",
    demoBalanced: "Demo data is 78% balanced.",
    superadmin: "Superadmin"
  }
} as const;

export type TranslationKey = keyof typeof dictionary.es;
