"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Chrome, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/components/ui/language-provider";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const [email, setEmail] = useState("admin@horaria.demo");
  const [password, setPassword] = useState("horaria-demo");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.get("google") === "not-configured") {
      setError(t("googleNotConfigured"));
    }
  }, [params, t]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
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
        setError(t("invalidCredentials"));
        return;
      }

      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[linear-gradient(135deg,#FFF7ED,#FFFFFF_48%,#F0FDF4)] p-5 dark:bg-background dark:bg-none lg:grid-cols-[0.9fr_1fr]">
      <div className="absolute right-5 top-5 z-20 flex gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <motion.section
        className="hidden flex-col justify-between rounded-[2rem] border bg-white/60 p-8 shadow-soft backdrop-blur-2xl dark:bg-white/[0.06] lg:flex"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link href="/" className="inline-flex">
          <Image src="/logo.png" alt="Horaria" width={320} height={104} className="h-20 w-auto object-contain" priority />
        </Link>
        <div>
          <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 dark:text-white">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-slate-600 dark:text-slate-300">
            {t("heroSubtitle")}
          </p>
        </div>
        <div className="rounded-2xl border bg-white/70 p-4 text-sm font-medium text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
          {t("demoCredentials")}
        </div>
      </motion.section>

      <section className="flex items-center justify-center">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-7 flex flex-col items-center gap-4 lg:hidden">
            <Image src="/logo.png" alt="Horaria" width={300} height={98} className="h-20 w-auto object-contain" priority />
          </div>

          <Card className="glass rounded-[1.75rem]">
            <CardHeader className="p-7 pb-4">
              <CardTitle className="text-2xl">{t("loginTitle")}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">{t("loginSubtitle")}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-7 pt-0">
              <Button type="button" variant="outline" className="w-full" disabled title={t("googleUnavailable")}>
                <Chrome className="h-4 w-4" />
                {t("continueWithGoogle")}
              </Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                {t("email")}
                <div className="h-px flex-1 bg-border" />
              </div>
              <form className="flex flex-col gap-4" onSubmit={submit}>
                <label className="block text-sm font-medium">
                  {t("email")}
                  <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-3 transition focus-within:ring-2 focus-within:ring-ring">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      className="border-0 px-0 focus-visible:ring-0"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>
                <label className="block text-sm font-medium">
                  {t("password")}
                  <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-3 transition focus-within:ring-2 focus-within:ring-ring">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      className="border-0 px-0 focus-visible:ring-0"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </label>
                {error && <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
                <Button className="w-full" size="lg" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? t("signingIn") : t("signIn")}
                </Button>
              </form>
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <Link href="/" className="inline-flex items-center gap-2 font-medium transition hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  {t("backHome")}
                </Link>
                <span>
                  {t("dontHaveAccount")}{" "}
                  <Link href="/register" className="font-semibold text-primary">
                    {t("register")}
                  </Link>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
