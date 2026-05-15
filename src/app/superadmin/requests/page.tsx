"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { campuses, registrationRequests } from "@/lib/demo-data";

export default function RequestsPage() {
  const [requests, setRequests] = useState(registrationRequests);

  async function decide(id: string, action: "approve" | "reject") {
    const request = requests.find((item) => item.id === id);
    await fetch(`/api/registration-requests/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId: id, campusId: request?.campusId ?? campuses[0].id, role: request?.requestedRole ?? "VIEWER" })
    });
    setRequests((current) => current.map((item) => (item.id === id ? { ...item, status: action === "approve" ? "APPROVED" : "REJECTED" } : item)));
  }

  return (
    <AppShell title="Solicitudes de registro" subtitle="Aprueba, rechaza, asigna sede y define rol de usuarios nuevos.">
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{request.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{request.email} - {request.institutionName}</p>
                    <p className="mt-2 text-sm">{request.message}</p>
                  </div>
                  <Badge>{request.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-secondary p-3 text-sm">Sede: {request.requestedCampus}</div>
                  <div className="rounded-xl bg-secondary p-3 text-sm">Rol solicitado: {request.requestedRole}</div>
                  <div className="rounded-xl bg-secondary p-3 text-sm">Fecha: {request.createdAt}</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => decide(request.id, "approve")} disabled={request.status !== "PENDING_APPROVAL"}>
                    <Check className="h-4 w-4" />
                    Aprobar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => decide(request.id, "reject")} disabled={request.status !== "PENDING_APPROVAL"}>
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
