import * as XLSX from "xlsx";
import { jsonError, requireAuth } from "@/lib/access-control";

export const runtime = "nodejs";

/**
 * Real .xlsx template with all 11 sheets. Headers are exactly the column names
 * the engine looks for, with one example row per sheet so users can copy.
 */
export async function GET() {
  try {
    await requireAuth();
    const wb = XLSX.utils.book_new();
    const add = (name: string, rows: Array<Record<string, string | number>>) => {
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    add("README", [
      { Instrucciones: "Completá sólo las hojas que necesites." },
      { Instrucciones: "No renombres los encabezados ni los nombres de hoja." },
      { Instrucciones: "Los nombres de cursos, materias y docentes deben coincidir entre hojas." },
      { Instrucciones: "Si la hoja de Disponibilidad cursos queda vacía, el sistema asume todos los bloques disponibles." },
      { Instrucciones: "La carga contractual se importa como horas pedagógicas (1 bloque = 1 hora)." },
      { Instrucciones: "Guardá como .xlsx y subilo desde Centro de importaciones → Importar Excel completo." }
    ]);
    add("Cursos", [
      { Curso: "1A", Año: 1, División: "A", "Aula base": "Aula 1A", "Cantidad de estudiantes": 25, Sede: "Sede Principal" }
    ]);
    add("Materias", [
      { Materia: "Matemática", Código: "MAT", Color: "#F59E0B", Sede: "Sede Principal" }
    ]);
    add("Docentes", [
      { Docente: "Ana Perez", Email: "ana.perez@demo.com", "Carga contractual semanal": 30, Notas: "Puede coordinar proyectos", Sede: "Sede Principal" }
    ]);
    add("Carga por curso", [
      { Curso: "1A", Materia: "Matemática", "Horas semanales": 5, Sede: "Sede Principal" }
    ]);
    add("Habilitaciones docentes", [
      { Docente: "Ana Perez", Materia: "Matemática", Curso: "1A", Sede: "Sede Principal" }
    ]);
    add("Disponibilidad docentes", [
      { Docente: "Ana Perez", Día: "Lunes", Bloque: 1, Inicio: "08:15", Fin: "09:15", Estado: "Disponible", Sede: "Sede Principal" }
    ]);
    add("Disponibilidad cursos", [
      { Curso: "1A", Día: "Lunes", Bloque: 1, Inicio: "08:15", Fin: "09:15", Estado: "Disponible", Sede: "Sede Principal" }
    ]);
    add("Proyectos", [
      {
        Proyecto: "Ciudadanos",
        Tipo: "Proyecto",
        Cursos: "1A,2A",
        Docentes: "Rocío Medina,Tomás Herrera",
        "Horas semanales": 2,
        "Día fijo": "",
        "Bloque fijo": "",
        "Inicio fijo": "",
        "Fin fijo": "",
        Notas: "Trabajo interdisciplinario",
        Sede: "Sede Principal"
      }
    ]);
    add("Aulas especiales", [
      { Aula: "Sala de Informática", Tipo: "Lab", Día: "Lunes", Bloque: 1, Inicio: "08:15", Fin: "09:15", Curso: "1A", Materia: "Tecnología", Docente: "Vanina Gerstner", Sede: "Sede Principal" }
    ]);
    add("Forzados opcional", [
      { Curso: "1A", Materia: "Matemática", Docente: "Ana Perez", Día: "Lunes", Bloque: 1, Inicio: "08:15", Fin: "09:15", Tipo: "REGULAR_CLASS", Motivo: "Pedido de coordinación", Sede: "Sede Principal" }
    ]);

    const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new Response(out, {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": 'attachment; filename="horaria_template.xlsx"'
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
