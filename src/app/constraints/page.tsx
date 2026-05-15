import { AlertTriangle, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const hard = [
  "No teacher overlaps",
  "No classroom overlaps",
  "One subject per course per slot",
  "Respect teacher availability",
  "Respect classroom type compatibility",
  "Satisfy weekly subject load"
];

const soft = [
  "Minimize schedule gaps",
  "Balance daily workload",
  "Avoid isolated classes",
  "Group consecutive modules",
  "Reduce inefficient distributions"
];

export default function ConstraintsPage() {
  return (
    <AppShell title="Constraints" subtitle="Tune the scheduling profile that feeds the CP-SAT optimizer.">
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_360px] lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Balanced academic week</CardTitle>
            <Button size="sm" variant="secondary">
              <SlidersHorizontal className="h-4 w-4" />
              Edit profile
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <Badge className="mb-4 border-emerald-300 bg-emerald-500/10 text-emerald-600">Hard constraints</Badge>
              <div className="space-y-3">
                {hard.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-4">
              <Badge className="mb-4 border-sky-300 bg-sky-500/10 text-sky-600">Soft constraints</Badge>
              <div className="space-y-3">
                {soft.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Conflict analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Unavailable teacher", "0", "All blocked slots respected."],
              ["Insufficient slots", "0", "Current weekly load fits available grid."],
              ["Room conflicts", "0", "Typed classroom compatibility is valid."],
              ["Impossible constraints", "0", "No contradictory requirements found."]
            ].map(([label, count, text]) => (
              <div key={label} className="rounded-2xl border bg-background/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{label}</span>
                  <Badge>{count}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
            <div className="rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mb-2 h-4 w-4" />
              Add one more laboratory before expanding 2A science modules.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
