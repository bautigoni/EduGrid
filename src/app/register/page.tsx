"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Chrome, KeyRound, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    invitationCode: "",
    message: ""
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, invitationCode: form.invitationCode.trim().toUpperCase() })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message ?? "No se pudo crear la cuenta.");
        return;
      }

      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#FFF7ED,#FFFFFF_48%,#F0FDF4)] p-5 dark:bg-background dark:bg-none">
      <div className="absolute right-5 top-5 z-20 flex gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <motion.div
        className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col justify-center gap-7 py-10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link href="/" className="inline-flex w-fit">
          <Image src="/logo.png" alt="Horaria" width={340} height={110} className="h-20 w-auto object-contain" priority />
        </Link>

        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-stretch">
          <section className="glass flex flex-col justify-between rounded-[1.75rem] p-7">
            <div>
              <h1 className="text-3xl font-bold">Crear cuenta</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Ingresá con el código de invitación de tu sede para activar tu acceso.
              </p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                Este acceso es para quienes gestionan la carga y generación de horarios.
              </p>
            </div>
            <div className="mt-8 rounded-2xl border bg-white/70 p-4 text-sm font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
              <p className="font-semibold">Códigos demo</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li><code className="font-mono">PUERTOS-HORARIOS-2026</code></li>
                <li><code className="font-mono">NORDELTA-HORARIOS-2026</code></li>
                <li><code className="font-mono">HORARIA-SUPERADMIN-2026</code></li>
              </ul>
            </div>
          </section>

          <Card className="glass rounded-[1.75rem]">
            <CardHeader className="p-7 pb-4">
              <CardTitle className="text-2xl">Crear cuenta</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                El código define automáticamente la sede y los permisos de uso.
              </p>
            </CardHeader>
            <CardContent className="p-7 pt-0">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
                <Input required placeholder="Nombre completo" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
                <Input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                <Input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Contraseña (mínimo 8 caracteres)"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    required
                    placeholder="Código de invitación"
                    className="pl-9 font-mono uppercase tracking-wider"
                    value={form.invitationCode}
                    onChange={(event) => setForm({ ...form, invitationCode: event.target.value })}
                  />
                </div>
                <textarea
                  className="min-h-24 rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring md:col-span-2"
                  placeholder="Mensaje opcional para el equipo de coordinación"
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                />
                {error && (
                  <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-700 md:col-span-2 dark:text-rose-300">{error}</p>
                )}
                <div className="flex flex-col gap-3 md:col-span-2 md:flex-row">
                  <Button size="lg" className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? "Creando cuenta..." : "Crear cuenta"}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    disabled
                    title="Google estará disponible próximamente."
                  >
                    <Chrome className="h-4 w-4" />
                    Continuar con Google
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground md:col-span-2">
                  Google estará disponible próximamente.
                </p>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <Link href="/" className="inline-flex items-center gap-2 font-medium transition hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a inicio
                </Link>
                <span>
                  ¿Ya tenés cuenta?{" "}
                  <Link href="/login" className="font-semibold text-primary">
                    Ingresar
                  </Link>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </main>
  );
}
