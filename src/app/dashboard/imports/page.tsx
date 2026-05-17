"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck2,
  FileDown,
  FileSpreadsheet,
  History,
  Loader2,
  PackageOpen,
  Upload
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const importBatches: Array<{
  id: string;
  campusId: string;
  type: string;
  status: string;
  filename: string;
  rows: number;
  validRows: number;
  errors: number;
  createdAt: string;
}> = [];

type Preview = {
  filename: string;
  preview: { columns: string[]; rows: Record<string, string>[]; errors: string[] };
};

const importTypes = [
  {
    key: "TEACHER_AVAILABILITY",
    template: "teacherAvailability",
    title: "Disponibilidad docente",
    description: "Actualizá los bloques disponibles de cada docente.",
    requiredForBundle: false
  },
  {
    key: "COURSE_SCHEDULE",
    template: "courseSchedule",
    title: "Horarios de cursos",
    description: "Cargá clases existentes por curso, materia y docente.",
    requiredForBundle: true
  },
  {
    key: "CLASSROOM_SCHEDULE",
    template: "classroomSchedule",
    title: "Horarios por aula",
    description: "Revisá ocupación de aulas y salas especiales.",
    requiredForBundle: false
  }
];

type ExcelSummary = {
  ok: boolean;
  mode: string;
  counts: {
    coursesCreated: number; coursesUpdated: number;
    subjectsCreated: number; subjectsUpdated: number;
    teachersCreated: number; teachersUpdated: number;
    requirementsCreated: number; requirementsUpdated: number;
    eligibilityCreated: number;
    teacherAvailabilityRows: number;
    courseAvailabilityRows: number;
    projectsCreated: number;
    forcedCreated: number;
  };
  detected: Record<string, number>;
  warnings: string[];
  errors: string[];
};

type BundleSummary = {
  ok: boolean;
  counts: {
    coursesCreated: number;
    subjectsCreated: number;
    teachersCreated: number;
    requirementsCreated: number;
    eligibilityCreated: number;
    availabilityRowsCreated: number;
  };
  warnings: string[];
};

type QuickKey = (typeof importTypes)[number]["key"];
type ExcelMode = "merge" | "replace_campus" | "validate";

export default function ImportsPage() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState("Elegí un archivo para revisar columnas y errores antes de importar.");
  const [campusId, setCampusId] = useState("");
  const [allowedCampusIds, setAllowedCampusIds] = useState<string[]>([]);
  const [quickFiles, setQuickFiles] = useState<Record<QuickKey, File | null>>({
    TEACHER_AVAILABILITY: null,
    COURSE_SCHEDULE: null,
    CLASSROOM_SCHEDULE: null
  });
  const [bundleBusy, setBundleBusy] = useState(false);
  const [bundleResult, setBundleResult] = useState<BundleSummary | null>(null);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelMode, setExcelMode] = useState<ExcelMode>("merge");
  const [excelBusy, setExcelBusy] = useState(false);
  const [excelResult, setExcelResult] = useState<ExcelSummary | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((response) => response.json())
      .then((data) => {
        const ids = Array.isArray(data.campuses) ? data.campuses.map((campus: { id: string }) => campus.id) : [];
        setAllowedCampusIds(ids);
        setCampusId(data.user?.selectedCampusId && ids.includes(data.user.selectedCampusId) ? data.user.selectedCampusId : ids[0] ?? "");
      })
      .catch(() => undefined);
  }, []);

  async function runBundle() {
    if (!campusId) {
      setBundleError("Seleccioná una sede.");
      return;
    }
    if (!quickFiles.COURSE_SCHEDULE && !quickFiles.TEACHER_AVAILABILITY) {
      setBundleError("Agregá horarios de cursos o disponibilidad docente para importar.");
      return;
    }
    setBundleBusy(true);
    setBundleError(null);
    setBundleResult(null);
    try {
      const [courseSchedule, teacherAvailability, classroomSchedule] = await Promise.all([
        quickFiles.COURSE_SCHEDULE?.text(),
        quickFiles.TEACHER_AVAILABILITY?.text(),
        quickFiles.CLASSROOM_SCHEDULE?.text()
      ]);
      const res = await fetch("/api/imports/bundle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, courseSchedule, teacherAvailability, classroomSchedule })
      });
      const data = await res.json();
      if (!res.ok) {
        setBundleError(data.message ?? "No se pudieron importar los archivos seleccionados.");
        return;
      }
      setBundleResult(data);
    } catch (err) {
      setBundleError(err instanceof Error ? err.message : "Error inesperado durante la importación.");
    } finally {
      setBundleBusy(false);
    }
  }

  async function runExcel() {
    if (!campusId) {
      setExcelError("Seleccioná una sede.");
      return;
    }
    if (!excelFile) {
      setExcelError("Seleccioná un archivo Excel.");
      return;
    }
    if (excelMode === "replace_campus" && !confirm("Esto reemplaza los datos operativos de la sede actual. ¿Continuar?")) return;
    setExcelBusy(true);
    setExcelError(null);
    setExcelResult(null);
    try {
      const form = new FormData();
      form.append("file", excelFile);
      form.append("campusId", campusId);
      form.append("mode", excelMode);
      const res = await fetch("/api/imports/excel", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!data) {
        setExcelError("No se pudo leer la respuesta de importación.");
        return;
      }
      setExcelResult(data);
      if (!res.ok && !data.ok) setExcelError(data.errors?.[0] ?? data.message ?? "La importación quedó incompleta.");
    } catch (err) {
      setExcelError(err instanceof Error ? err.message : "Error inesperado durante la importación.");
    } finally {
      setExcelBusy(false);
    }
  }

  async function previewQuickFile(file: File, importType: QuickKey) {
    const form = new FormData();
    form.append("file", file);
    form.append("type", importType);
    form.append("campusId", campusId);
    const response = await fetch("/api/imports/preview", { method: "POST", body: form });
    const data = await response.json();
    setPreview(data);
    setStatus(data.preview.errors.length ? "Encontramos observaciones para revisar antes de importar." : "Archivo listo para importar.");
  }

  async function handleQuickFile(importType: QuickKey, file: File | null) {
    setQuickFiles((current) => ({ ...current, [importType]: file }));
    setBundleResult(null);
    setBundleError(null);
    if (file) await previewQuickFile(file, importType);
  }

  return (
    <AppShell title="Importaciones" subtitle="Cargá datos desde Excel o actualizá información de la sede.">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Card className="overflow-hidden border-emerald-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5 p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge className="mb-3 bg-emerald-100 text-emerald-900">Recomendado</Badge>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                    Importar Excel completo
                  </CardTitle>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Subí cursos, docentes, materias, disponibilidad y proyectos en un solo archivo. Revisá el resultado antes de seguir trabajando.
                  </p>
                </div>
                <Button asChild variant="secondary" className="min-h-11">
                  <Link href="/api/imports/excel/template">
                    <Download className="h-4 w-4" />
                    Descargar plantilla
                  </Link>
                </Button>
              </div>

              <label
                htmlFor="full-excel-import"
                className={`group flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed p-6 text-center transition ${
                  excelFile
                    ? "border-emerald-300 bg-emerald-50/80"
                    : "border-orange-200 bg-orange-50/60 hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                <input
                  id="full-excel-import"
                  type="file"
                  accept=".xlsx"
                  className="sr-only"
                  onChange={(event) => setExcelFile(event.target.files?.[0] ?? null)}
                />
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm transition group-hover:scale-105">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="text-base font-semibold">{excelFile ? excelFile.name : "Seleccionar archivo Excel"}</span>
                <span className="mt-2 max-w-md text-sm text-muted-foreground">
                  {excelFile ? "Archivo preparado para importar." : "Arrastrá o elegí el archivo institucional con la información de horarios."}
                </span>
              </label>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["merge", "Combinar sin duplicar"],
                    ["replace_campus", "Reemplazar datos de la sede"],
                    ["validate", "Validar sin guardar"]
                  ].map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExcelMode(mode as ExcelMode)}
                      className={`min-h-11 rounded-2xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        excelMode === mode
                          ? "border-emerald-300 bg-emerald-100 text-emerald-950"
                          : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Button onClick={runExcel} disabled={excelBusy || !campusId || !excelFile} className="min-h-11">
                  {excelBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                  {excelMode === "validate" ? "Validar archivo" : "Importar datos"}
                </Button>
              </div>

              {excelError && (
                <StatusMessage tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
                  {excelError}
                </StatusMessage>
              )}
              {excelResult && <ExcelSummaryCard summary={excelResult} />}
            </div>

            <div className="border-t bg-gradient-to-br from-emerald-50/90 via-white to-orange-50/80 p-5 sm:p-7 lg:border-l lg:border-t-0">
              <h3 className="text-sm font-semibold text-slate-900">Cómo preparar el archivo</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                {[
                  "Usá la plantilla para mantener nombres de hojas y columnas consistentes.",
                  "Revisá que docentes, cursos y materias estén escritos igual en todo el archivo.",
                  "Validá sin guardar cuando quieras probar una carga grande antes de aplicarla."
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/80 bg-white/70 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" className="mt-5 min-h-11 w-full justify-center">
                <Link href={`/api/imports/excel/export?campusId=${campusId}`}>
                  <FileDown className="h-4 w-4" />
                  Descargar datos actuales
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageOpen className="h-5 w-5 text-orange-600" />
                Importaciones rápidas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Actualizá una parte de la información sin cargar todo el archivo institucional.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-3">
                {importTypes.map((item) => (
                  <QuickImportCard
                    key={item.key}
                    item={item}
                    file={quickFiles[item.key]}
                    onFile={(file) => handleQuickFile(item.key, file)}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-3 rounded-3xl border bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Archivos seleccionados: {Object.values(quickFiles).filter(Boolean).length}</p>
                  <p className="text-sm text-muted-foreground">Podés revisar la vista previa y luego importar los archivos cargados.</p>
                </div>
                <Button onClick={runBundle} disabled={bundleBusy || !campusId || (!quickFiles.COURSE_SCHEDULE && !quickFiles.TEACHER_AVAILABILITY)} className="min-h-11">
                  {bundleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Importar archivos
                </Button>
              </div>
              {bundleError && (
                <StatusMessage tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
                  {bundleError}
                </StatusMessage>
              )}
              {bundleResult && <BundleSummaryCard summary={bundleResult} />}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <p className="text-sm text-muted-foreground">{status}</p>
            </CardHeader>
            <CardContent>
              {!preview ? (
                <div className="rounded-3xl border border-dashed bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                  Seleccioná un archivo rápido para ver columnas, filas de muestra y observaciones antes de importar.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{preview.filename}</Badge>
                    <Badge className="bg-emerald-100 text-emerald-900">{preview.preview.columns.length} columnas</Badge>
                    <Badge className="bg-emerald-100 text-emerald-900">{preview.preview.rows.length} filas de muestra</Badge>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-emerald-50">
                        <tr>
                          {preview.preview.columns.map((column, columnIndex) => (
                            <th key={`preview-heading-${columnIndex}-${column}`} className="p-3 text-left text-xs font-semibold text-slate-600">{column}</th>
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
                  {preview.preview.errors.length ? (
                    <div className="space-y-2">
                      {preview.preview.errors.map((error, errorIndex) => (
                        <StatusMessage key={`preview-error-${errorIndex}-${error}`} tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
                          {error}
                        </StatusMessage>
                      ))}
                    </div>
                  ) : (
                    <StatusMessage tone="success" icon={<CheckCircle2 className="h-4 w-4" />}>
                      No encontramos errores en la muestra.
                    </StatusMessage>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-600" />
              Historial de importaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {importBatches.filter((batch) => allowedCampusIds.includes(batch.campusId)).length === 0 ? (
              <div className="rounded-3xl border border-dashed bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                Todavía no hay importaciones registradas para esta sede.
              </div>
            ) : (
              importBatches.filter((batch) => allowedCampusIds.includes(batch.campusId)).map((batch) => (
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
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function QuickImportCard({
  item,
  file,
  onFile
}: {
  item: (typeof importTypes)[number];
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const inputId = `quick-import-${item.key}`;
  return (
    <div className={`rounded-3xl border p-4 transition ${file ? "border-emerald-300 bg-emerald-50/80" : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"}`}>
      <div className="flex min-h-[116px] flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </div>
          {item.requiredForBundle && <Badge className="bg-orange-100 text-orange-900">Base</Badge>}
        </div>
        <div className="mt-auto pt-4">
          <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
            {file ? file.name : "Sin archivo seleccionado"}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            <Button asChild variant="secondary" size="sm" className="min-h-10 justify-center">
              <Link href={`/api/imports/template?type=${item.template}`}>
                <Download className="h-4 w-4" />
                Plantilla
              </Link>
            </Button>
            <label htmlFor={inputId} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-100 px-3 text-sm font-semibold text-orange-950 transition hover:bg-orange-200 focus-within:ring-2 focus-within:ring-orange-400">
              <Upload className="h-4 w-4" />
              Cargar
              <input
                id={inputId}
                type="file"
                accept=".csv,.xlsx"
                className="sr-only"
                onChange={(event) => onFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExcelSummaryCard({ summary }: { summary: ExcelSummary }) {
  const allCountsZero = Object.values(summary.counts).every((n) => !n);
  const isValidate = summary.mode === "validate";
  return (
    <div className="space-y-3 rounded-3xl border bg-white p-4 text-sm">
      <div className={`flex items-center gap-2 font-semibold ${summary.ok && !isValidate ? "text-emerald-700" : isValidate ? "text-sky-700" : "text-rose-700"}`}>
        {summary.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {isValidate ? "Validación completada sin guardar cambios" : summary.ok ? "Importación completada" : "Importación con observaciones"}
      </div>
      <MetricList
        title="Detectado en el archivo"
        items={Object.entries(summary.detected).map(([label, value]) => ({ label, value }))}
      />
      <MetricList
        title={isValidate ? "Cambios previstos" : "Cambios aplicados"}
        items={[
          { label: "Cursos", value: `+${summary.counts.coursesCreated} / ~${summary.counts.coursesUpdated}` },
          { label: "Materias", value: `+${summary.counts.subjectsCreated} / ~${summary.counts.subjectsUpdated}` },
          { label: "Docentes", value: `+${summary.counts.teachersCreated} / ~${summary.counts.teachersUpdated}` },
          { label: "Cargas", value: `+${summary.counts.requirementsCreated} / ~${summary.counts.requirementsUpdated}` },
          { label: "Habilitaciones", value: `+${summary.counts.eligibilityCreated}` },
          { label: "Disp. docente", value: `+${summary.counts.teacherAvailabilityRows}` },
          { label: "Disp. cursos", value: `+${summary.counts.courseAvailabilityRows}` },
          { label: "Proyectos", value: `+${summary.counts.projectsCreated}` }
        ]}
      />
      {summary.errors.length > 0 && <DetailsList tone="danger" title={`${summary.errors.length} error(es)`} items={summary.errors} open />}
      {summary.warnings.length > 0 && <DetailsList tone="warning" title={`${summary.warnings.length} advertencia(s)`} items={summary.warnings.slice(0, 50)} />}
      {!isValidate && allCountsZero && summary.errors.length === 0 && (
        <p className="text-xs text-muted-foreground">No hubo cambios para aplicar.</p>
      )}
    </div>
  );
}

function BundleSummaryCard({ summary }: { summary: BundleSummary }) {
  return (
    <div className="space-y-3 rounded-3xl border bg-white p-4 text-sm">
      <div className="flex items-center gap-2 font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Importación completada
      </div>
      <MetricList
        title="Cambios aplicados"
        items={[
          { label: "Cursos creados", value: summary.counts.coursesCreated },
          { label: "Materias creadas", value: summary.counts.subjectsCreated },
          { label: "Docentes creados", value: summary.counts.teachersCreated },
          { label: "Cargas por curso", value: summary.counts.requirementsCreated },
          { label: "Habilitaciones", value: summary.counts.eligibilityCreated },
          { label: "Disponibilidades", value: summary.counts.availabilityRowsCreated }
        ]}
      />
      {summary.warnings.length > 0 && <DetailsList tone="warning" title={`${summary.warnings.length} advertencia(s)`} items={summary.warnings} />}
    </div>
  );
}

function MetricList({ title, items }: { title: string; items: Array<{ label: string; value: string | number }> }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.label} className="rounded-2xl border bg-slate-50 px-3 py-2 text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <strong className="ml-1 text-slate-950">{item.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailsList({ title, items, tone, open }: { title: string; items: string[]; tone: "danger" | "warning"; open?: boolean }) {
  const classes = tone === "danger"
    ? "border-rose-300 bg-rose-50 text-rose-800"
    : "border-amber-300 bg-amber-50 text-amber-800";
  return (
    <details open={open} className={`rounded-2xl border p-3 ${classes}`}>
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <ul className="ml-4 mt-2 list-disc space-y-0.5 text-xs">
        {items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
      </ul>
    </details>
  );
}

function StatusMessage({ tone, icon, children }: { tone: "success" | "danger"; icon: ReactNode; children: ReactNode }) {
  const classes = tone === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-300 bg-rose-50 text-rose-800";
  return (
    <div className={`flex items-center gap-2 rounded-2xl border p-3 text-sm ${classes}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}
