"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Building2, CalendarCheck, CheckCircle2, Chrome, FileSpreadsheet, Layers3, ShieldAlert, Sparkles, Users, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const features = [
  {
    title: "Disponibilidad docente",
    text: "Cargá horarios, preferencias y restricciones por docente.",
    icon: Users
  },
  {
    title: "Generación automática",
    text: "Creá grillas completas respetando reglas y condiciones.",
    icon: WandSparkles
  },
  {
    title: "Multisede",
    text: "Gestioná horarios por sede con usuarios y permisos.",
    icon: Building2
  },
  {
    title: "Proyectos y optativas",
    text: "Coordiná bloques donde deben coincidir varios docentes.",
    icon: Layers3
  },
  {
    title: "Conflictos claros",
    text: "Detectá problemas y recibí sugerencias concretas.",
    icon: ShieldAlert
  },
  {
    title: "Vistas por rol",
    text: "Consultá horarios por docente, curso, aula o sede.",
    icon: CalendarCheck
  }
] as const;

function MotionButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#FFF7ED,#F0FDF4_48%,#ffffff)] text-slate-900 dark:bg-background dark:bg-none dark:text-white">
      <section className="grid-bg relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(253,186,116,0.28),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(134,239,172,0.3),transparent_32%)]" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Horaria" width={218} height={72} className="h-12 w-auto object-contain" priority />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Solicitar acceso</Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <Badge className="mb-6 border-orange-300 bg-orange-500/10 text-orange-700">IA para horarios escolares</Badge>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="max-w-4xl text-5xl font-bold leading-tight tracking-normal sm:text-6xl">
              Horarios escolares inteligentes, sin planillas eternas.
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              Organizá docentes, cursos, aulas y sedes en una grilla clara, automática y sin conflictos.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <MotionButton>
                <Button asChild size="lg">
                  <Link href="/login">
                    Ingresar
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </MotionButton>
              <MotionButton>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/register">Solicitar acceso</Link>
                </Button>
              </MotionButton>
              <MotionButton>
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">Ver demo</Link>
                </Button>
              </MotionButton>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Button asChild variant="ghost" className="mt-4">
                <Link href="/api/auth/google">
                  <Chrome className="h-4 w-4" />
                  Continuar con Google
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="glass rounded-[2rem] p-3">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-[1.5rem] border bg-white p-4 shadow-soft dark:bg-card"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Northfield Nordelta</p>
                  <h2 className="text-xl font-bold">Panel de horarios</h2>
                </div>
                <Badge className="border-green-300 bg-green-500/10 text-green-700">94 score</Badge>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 30 }).map((_, index) => (
                  <div
                    key={`mockup-cell-${index}`}
                    className="min-h-20 rounded-xl border bg-orange-50 p-2 dark:bg-white/5"
                    style={index % 5 === 0 ? { background: "linear-gradient(135deg, rgba(253,186,116,.38), rgba(134,239,172,.32))" } : undefined}
                  >
                    {index % 7 === 0 && <div className="h-3 w-12 rounded-full bg-orange-300" />}
                    {index % 5 === 0 && <div className="mt-2 h-8 rounded-lg bg-white/80 dark:bg-white/10" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <motion.section
        className="mx-auto grid max-w-7xl gap-4 px-6 py-16 md:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
      >
        {features.map((feature) => (
          <motion.div key={`feature-${feature.title}`} variants={fadeInUp}>
            <Card className="glass h-full">
              <CardContent className="p-6">
                <feature.icon className="mb-4 h-7 w-7 text-orange-600" />
                <h3 className="font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-2">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={slideInLeft}>
          <Card>
            <CardContent className="p-8">
              <Badge className="mb-4 bg-orange-500/10 text-orange-700">El problema</Badge>
              <h2 className="text-3xl font-bold">Demasiadas reglas, poco tiempo.</h2>
              <p className="mt-4 text-muted-foreground">Docentes, aulas, cursos, sedes y proyectos especiales se cruzan en cada decisión.</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={slideInRight}>
          <Card>
            <CardContent className="p-8">
              <Badge className="mb-4 bg-green-500/10 text-green-700">La solución</Badge>
              <h2 className="text-3xl font-bold">Una grilla visual que valida todo.</h2>
              <p className="mt-4 text-muted-foreground">Generá, ajustá y exportá horarios con conflictos explicados en lenguaje claro.</p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <motion.section className="mx-auto max-w-7xl px-6 py-12" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeInUp}>
        <div className="rounded-[2rem] border bg-white/80 p-8 shadow-soft backdrop-blur-xl dark:bg-white/[0.06]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Building2 className="mb-4 h-9 w-9 text-green-600" />
              <h2 className="text-3xl font-bold">Multisede desde el inicio.</h2>
              <p className="mt-3 text-muted-foreground">Permisos, usuarios y horarios filtrados por campus.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {["Northfield Nordelta", "Northfield Puertos", "Reglas de traslado", "Aprobación de usuarios"].map((item) => (
                <div key={`campus-pill-${item}`} className="rounded-2xl border bg-background/70 p-4 font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="mx-auto max-w-7xl px-6 pb-20 pt-10" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={scaleIn}>
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white md:p-12">
          <Sparkles className="mb-4 h-8 w-8 text-orange-300" />
          <h2 className="text-3xl font-bold">Planificá mejor la próxima semana.</h2>
          <p className="mt-3 max-w-2xl text-white/70">Probá el demo multisede o solicitá acceso para tu institución.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <MotionButton>
              <Button asChild size="lg">
                <Link href="/register">Solicitar acceso</Link>
              </Button>
            </MotionButton>
            <MotionButton>
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Ver demo</Link>
              </Button>
            </MotionButton>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
