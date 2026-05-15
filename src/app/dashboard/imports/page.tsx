"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { importBatches } from "@/lib/demo-data";

type Preview = {
  filename: string;
  preview: { columns: string[]; rows: Record<string, string>[]; errors: string[] };
};

const importTypes = [
  {
    key: "TEACHER_AVAILABILITY",
    template: "teacherAvailability",
    title: "Importar disponibilidad horaria",
    description: "Importa disponibilidad docente, profesor por profesor."
  },
  {
    key: "COURSE_SCHEDULE",
    template: "courseSchedule",
    title: "Importar horarios de cursos",
    description: "Importa horarios existentes separados por curso y division."
  },
  {
    key: "CLASSROOM_SCHEDULE",
    template: "classroomSchedule",
    title: "Importar horarios por aula",
    description: "Importa ocupacion de aulas y salas especiales."
  }
];

export default function ImportsPage() {
  const [type, setType] = useState(importTypes[0].key);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState("Esperando archivo CSV.");

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    const response = await fetch("/api/imports/preview", { method: "POST", body: form });
    const data = await response.json();
    setPreview(data);
    setStatus(data.preview.errors.length ? "Validacion con errores" : "Validacion lista para confirmar");
  }

  return (
    <AppShell title="Centro de importaciones" subtitle="Carga Disponibilidad horaria, Horarios cursos y horarios por aula desde CSV.">
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[420px_1fr] lg:p-8">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Nuevo import</CardTitle>
            <p className="text-sm text-muted-foreground">CSV disponible ahora. XLSX queda preparado por contrato de API.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <select className="h-11 w-full rounded-xl border bg-background px-3 text-sm" value={type} onChange={(event) => setType(event.target.value)}>
              {importTypes.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.title}
                </option>
              ))}
            </select>
            <label className="block rounded-2xl border border-dashed bg-background/70 p-6 text-center">
              <Upload className="mx-auto mb-3 h-8 w-8 text-orange-600" />
              <span className="text-sm font-semibold">Subir CSV</span>
              <Input className="mt-4" type="file" accept=".csv,.xlsx" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
            </label>
            <div className="grid gap-2">
              {importTypes.map((item) => (
                <Button key={item.key} asChild variant="secondary" className="justify-start">
                  <Link href={`/api/imports/template?type=${item.template}`}>
                    <Download className="h-4 w-4" />
                    Descargar plantilla: {item.title.replace("Importar ", "")}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa y mapeo</CardTitle>
              <p className="text-sm text-muted-foreground">{status}</p>
            </CardHeader>
            <CardContent>
              {!preview ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Selecciona un archivo para ver columnas, mapear campos, validar errores y confirmar importacion.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{preview.filename}</Badge>
                    <Badge>{preview.preview.columns.length} columnas</Badge>
                    <Badge>{preview.preview.rows.length} filas preview</Badge>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {preview.preview.columns.map((column, columnIndex) => (
                            <th key={`preview-heading-${columnIndex}-${column}`} className="p-3 text-left">{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.rows.map((row, index) => (
                          <tr key={index} className="border-t">
                            {preview.preview.columns.map((column, columnIndex) => (
                              <td key={`preview-cell-${index}-${columnIndex}-${column}`} className="p-3">{row[column]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <h3 className="mb-3 font-semibold">Validacion</h3>
                    {preview.preview.errors.length ? (
                      <div className="space-y-2">
                        {preview.preview.errors.map((error, errorIndex) => (
                          <div key={`preview-error-${errorIndex}-${error}`} className="flex items-center gap-2 text-sm text-rose-600">
                            <AlertTriangle className="h-4 w-4" />
                            {error}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Sin errores en la muestra. Puedes confirmar el import.
                      </div>
                    )}
                  </div>
                  <Button disabled={preview.preview.errors.length > 0}>Confirmar importacion</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de importaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {importBatches.map((batch) => (
                <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold">{batch.filename}</p>
                      <p className="text-sm text-muted-foreground">{batch.rows} filas, {batch.errors} errores</p>
                    </div>
                  </div>
                  <Badge>{batch.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
