import { BarChart3, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScopedDemoContext } from "@/lib/demo-scope";

const rows = [
  ["Uso docente", "82%", "Saludable"],
  ["Uso de aulas", "64%", "Con margen"],
  ["Huecos promedio", "1.4", "Mejorando"],
  ["Módulos consecutivos", "71%", "Fuerte"]
];

export default async function AnalyticsPage() {
  const data = await getScopedDemoContext();
  return (
    <AppShell title="Analítica" subtitle="Entendé calidad, utilización y oportunidades de mejora.">
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-8">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Calidad de optimización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map(([label, value, status], index) => (
              <div key={label} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">{status}</p>
                  </div>
                  <Badge>{value}</Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${[82, 64, 35, 71][index]}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="min-w-0 space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tendencia de versiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-56 items-end gap-3">
                {[68, 74, 81, 88, 94].map((height, index) => (
                  <div key={`trend-${index}-${height}`} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-xl bg-[linear-gradient(180deg,#27d3bf,#60a5fa)]" style={{ height: `${height}%` }} />
                    <span className="text-xs text-muted-foreground">v{index + 1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <InsightPanel insights={data.insights} />
        </div>
      </div>
    </AppShell>
  );
}
