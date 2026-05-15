import Link from "next/link";
import { CalendarPlus, FileSpreadsheet, Printer, Sparkles, Upload, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-auto min-h-12 justify-center text-center">
          <Link href="/scheduler">
            <Sparkles className="h-4 w-4" />
            Generar horario
          </Link>
        </Button>
        <Button asChild variant="secondary" className="h-auto min-h-12 justify-center text-center whitespace-normal">
          <Link href="/dashboard/imports">
            <Upload className="h-4 w-4" />
            Importar disponibilidad
          </Link>
        </Button>
        <Button asChild variant="secondary" className="h-auto min-h-12 justify-center text-center whitespace-normal">
          <Link href="/dashboard/imports">
            <FileSpreadsheet className="h-4 w-4" />
            Importar horarios cursos
          </Link>
        </Button>
        <Button asChild variant="secondary" className="h-auto min-h-12 justify-center text-center whitespace-normal">
          <Link href="/projects">
            <Workflow className="h-4 w-4" />
            Crear proyecto/electiva
          </Link>
        </Button>
        <Button variant="secondary" className="h-auto min-h-12 justify-center text-center">
          <CalendarPlus className="h-4 w-4" />
          Ver conflictos
        </Button>
        <Button variant="secondary" className="h-auto min-h-12 justify-center text-center">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </CardContent>
    </Card>
  );
}
