"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Chrome, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("admin@horaria.demo");
  const [password, setPassword] = useState("horaria-demo");
  const [error, setError] = useState(params.get("google") === "not-configured" ? "Google OAuth esta preparado, pero faltan GOOGLE_CLIENT_ID y GOOGLE_REDIRECT_URI." : "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      if (data.status === "PENDING_APPROVAL") {
        router.push("/pending-approval");
        return;
      }
      if (data.status === "REJECTED") {
        setError("Tu solicitud fue rechazada. Contacta a un administrador de la institucion.");
        return;
      }
      setError("Credenciales invalidas o cuenta sin aprobar.");
      return;
    }

    router.push(params.get("next") ?? "/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-[linear-gradient(135deg,#FFF7ED,#F0FDF4)] p-6 dark:bg-background dark:bg-none lg:grid-cols-[1fr_0.9fr]">
      <section className="hidden flex-col justify-between rounded-[2rem] border bg-white/60 p-10 shadow-soft backdrop-blur-2xl dark:bg-white/[0.06] lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Horaria" width={220} height={72} className="h-12 w-auto object-contain" priority />
        </Link>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-orange-600">Gestion escolar inteligente</p>
          <h1 className="max-w-xl text-5xl font-bold leading-tight text-slate-900 dark:text-white">
            Horarios claros para sedes, docentes, proyectos y cursos.
          </h1>
          <p className="mt-5 max-w-xl text-slate-600 dark:text-slate-300">
            Ingresa para generar horarios, aprobar solicitudes, importar planillas y coordinar proyectos como Ciudadanos, electivas y optativas.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {["Multisede", "Aprobaciones", "Solver CP-SAT"].map((item) => (
            <div key={item} className="rounded-2xl bg-white/70 p-4 text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center">
        <div className="absolute right-6 top-6">
          <div className="flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <Card className="glass w-full max-w-md">
          <CardHeader>
            <CardTitle>Ingresar</CardTitle>
            <p className="text-sm text-muted-foreground">Usa tu cuenta aprobada por la institucion.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/api/auth/google">
                <Chrome className="h-4 w-4" />
                Continuar con Google
              </Link>
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              o con email
              <div className="h-px flex-1 bg-border" />
            </div>
            <form className="space-y-4" onSubmit={submit}>
              <label className="block text-sm font-medium">
                Email
                <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input className="border-0 px-0 focus-visible:ring-0" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              </label>
              <label className="block text-sm font-medium">
                Contrasena
                <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input className="border-0 px-0 focus-visible:ring-0" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
              </label>
              {error && <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
              <Button className="w-full" size="lg">Ingresar</Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Necesitas acceso?{" "}
              <Link href="/register" className="font-semibold text-primary">
                Solicitar cuenta
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center">Cargando...</main>}>
      <LoginForm />
    </Suspense>
  );
}
