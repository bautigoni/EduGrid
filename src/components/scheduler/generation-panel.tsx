"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GenerationPanel() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ score?: number; entries?: unknown[]; note?: string } | null>(null);

  async function generate() {
    setStatus("running");
    setResult(null);
    setProgress(18);
    const steps = [38, 57, 76, 91];
    steps.forEach((value, index) => {
      window.setTimeout(() => setProgress(value), 450 * (index + 1));
    });

    const response = await fetch("/api/scheduler/generate", { method: "POST" });
    const data = await response.json();
    window.setTimeout(() => {
      setProgress(100);
      setResult(data);
      setStatus(data.status === "SUCCESS" ? "done" : "failed");
    }, 2200);
  }

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Constraint engine</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">CP-SAT optimization with hard and soft constraints.</p>
        </div>
        <Badge className="border-primary/30 bg-primary/10 text-primary">OR-Tools ready</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button size="lg" className="w-full" onClick={generate} disabled={status === "running"}>
          {status === "running" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          Generate Schedule
        </Button>

        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#27d3bf,#60a5fa)]"
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {["Teacher overlaps", "Room collisions", "Weekly loads"].map((label) => (
            <div key={label} className="rounded-2xl border bg-background/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {label}
              </div>
              <p className="text-xs text-muted-foreground">Validated during solve.</p>
            </div>
          ))}
        </div>

        {result && (
          <div className="rounded-2xl border bg-background/70 p-4">
            <div className="flex items-center gap-2 font-semibold">
              {status === "done" ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <AlertTriangle className="h-5 w-5 text-rose-500" />}
              {status === "done" ? `Generated score ${result.score}` : "Generation failed"}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {status === "done"
                ? `${result.entries?.length ?? 0} modules placed. ${result.note ?? "Schedule saved as a new version."}`
                : "Insufficient compatible slots. Try relaxing availability or adding classrooms."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
