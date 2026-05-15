import { BarChart3, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rows = [
  ["Teacher utilization", "82%", "Healthy"],
  ["Room utilization", "64%", "Room to grow"],
  ["Average teacher gaps", "1.4", "Improving"],
  ["Consecutive modules", "71%", "Strong"]
];

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics" subtitle="Understand schedule quality, utilization, and optimization tradeoffs.">
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_420px] lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Optimization quality
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
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Version trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-56 items-end gap-3">
                {[68, 74, 81, 88, 94].map((height, index) => (
                  <div key={height} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-xl bg-[linear-gradient(180deg,#27d3bf,#60a5fa)]" style={{ height: `${height}%` }} />
                    <span className="text-xs text-muted-foreground">v{index + 1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <InsightPanel />
        </div>
      </div>
    </AppShell>
  );
}
