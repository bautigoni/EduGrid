"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chrome, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { campuses } from "@/lib/demo-data";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    institutionName: "Northfield School",
    requestedCampus: campuses[0].name,
    requestedRole: "SCHEDULER",
    message: ""
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "No se pudo enviar la solicitud.");
      return;
    }

    router.push("/pending-approval");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#FFF7ED,#F0FDF4)] p-6 dark:bg-background dark:bg-none">
      <div className="absolute right-6 top-6">
        <div className="flex gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 py-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Horaria" width={220} height={72} className="h-12 w-auto object-contain" priority />
        </Link>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Solicitar acceso</CardTitle>
            <p className="text-sm text-muted-foreground">Tu cuenta quedara pendiente hasta que un superadmin o administrador de sede la apruebe.</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <Input required placeholder="Nombre completo" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              <Input required type="email" placeholder="Email institucional" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <Input required type="password" minLength={8} placeholder="Contrasena" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <Input required placeholder="Institucion" value={form.institutionName} onChange={(event) => setForm({ ...form, institutionName: event.target.value })} />
              <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={form.requestedCampus} onChange={(event) => setForm({ ...form, requestedCampus: event.target.value })}>
                {campuses.map((campus) => (
                  <option key={campus.id}>{campus.name}</option>
                ))}
              </select>
              <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={form.requestedRole} onChange={(event) => setForm({ ...form, requestedRole: event.target.value })}>
                <option value="CAMPUS_ADMIN">Administrador de sede</option>
                <option value="SCHEDULER">Planificador</option>
                <option value="VIEWER">Solo lectura</option>
              </select>
              <textarea
                className="min-h-28 rounded-xl border bg-background px-3 py-2 text-sm md:col-span-2"
                placeholder="Mensaje opcional"
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
              />
              {error && <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 md:col-span-2">{error}</p>}
              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row">
                <Button size="lg" className="flex-1">
                  <Send className="h-4 w-4" />
                  Enviar solicitud
                </Button>
                <Button asChild size="lg" variant="outline" className="flex-1">
                  <Link href="/api/auth/google">
                    <Chrome className="h-4 w-4" />
                    Solicitar con Google
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
