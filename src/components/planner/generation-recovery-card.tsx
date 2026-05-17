"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerationRecoveryCard({ campusId, status }: { campusId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function discard() {
    setBusy(true);
    try {
      await fetch("/api/scheduler/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campusId, action: "discard_failed" })
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">La ultima generacion no se completo.</p>
            <p className="text-xs opacity-80">Estado tecnico: {status}. El planner sigue usando la ultima version completada.</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={discard} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Descartar generacion fallida
        </Button>
      </div>
    </div>
  );
}
