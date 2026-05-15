"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, type Variants, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, CalendarCheck, Layers3, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/components/ui/language-provider";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } }
};

const logoMotion: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

function ActionLink({
  href,
  children,
  variant = "default"
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline";
}) {
  const [loading, setLoading] = useState(false);

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Button asChild size="lg" variant={variant} className="min-w-36">
        <Link href={href} prefetch onClick={() => setLoading(true)}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {children}
        </Link>
      </Button>
    </motion.div>
  );
}

export default function LandingPage() {
  const { t } = useI18n();
  const { scrollYProgress } = useScroll();
  const logoScale = useTransform(scrollYProgress, [0, 0.28], [1.18, 0.72]);
  const logoY = useTransform(scrollYProgress, [0, 0.28], [0, -84]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.32], [1, 0.92]);
  const benefits = [
    { title: t("firstBenefitTitle"), text: t("firstBenefitText"), icon: CalendarCheck },
    { title: t("secondBenefitTitle"), text: t("secondBenefitText"), icon: ShieldAlert },
    { title: t("thirdBenefitTitle"), text: t("thirdBenefitText"), icon: Layers3 }
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#FFF7ED_0%,#FFFFFF_42%,#F0FDF4_100%)] text-slate-900 dark:bg-background dark:bg-none dark:text-white">
      <section className="grid-bg relative flex min-h-[112vh] flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(253,186,116,0.28),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(134,239,172,0.28),transparent_28%)]" />
        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-end gap-2 px-5 py-5 sm:px-8">
          <LanguageSwitcher />
          <ThemeToggle />
        </nav>

        <motion.div
          className="sticky top-0 z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 pb-16 text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={logoMotion} style={{ scale: logoScale, y: logoY, opacity: logoOpacity }} className="w-full">
            <div className="mx-auto flex w-full max-w-[780px] flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Image src="/logo-mark.png" alt="Horaria" width={220} height={220} className="h-32 w-32 object-contain sm:h-44 sm:w-44" priority />
              <div className="text-center sm:text-left">
                <div className="text-6xl font-black tracking-normal text-slate-800 sm:text-8xl dark:text-white">Horaria</div>
                <div className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-emerald-600 sm:text-xl">Organizá. Planificá. Enseñá.</div>
              </div>
            </div>
          </motion.div>
          <motion.p variants={fadeInUp} className="mt-5 text-base font-medium text-slate-600 dark:text-slate-300 sm:text-lg">
            {t("schoolSchedulingAi")}
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ActionLink href="/login">
              {t("signIn")}
              <ArrowRight className="h-4 w-4" />
            </ActionLink>
            <ActionLink href="/register" variant="secondary">
              {t("register")}
            </ActionLink>
            <ActionLink href="/api/auth/demo" variant="outline">
              {t("viewDemo")}
            </ActionLink>
          </motion.div>
          <motion.div
            variants={fadeInUp}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-8 flex flex-col items-center gap-2 text-xs font-semibold text-slate-500"
          >
            <span>Scroll</span>
            <ArrowDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm dark:bg-white/[0.06]">
            <Sparkles className="h-4 w-4" />
            Horaria
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {t("heroSubtitle")}
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid gap-3 sm:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} className="glass h-full rounded-2xl transition hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-5">
                  <Icon className="mb-4 h-7 w-7 text-orange-600" />
                  <h2 className="text-base font-bold">{benefit.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </motion.section>

      <motion.section
        className="mx-auto max-w-7xl px-6 pb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
      >
        <div className="glass rounded-[2rem] p-4">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="rounded-[1.5rem] border bg-white p-4 shadow-soft dark:bg-card">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vista demo</p>
                <h2 className="text-xl font-bold">Grilla semanal</h2>
              </div>
              <div className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-700">Sin conflictos</div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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
        </div>
      </motion.section>
    </main>
  );
}
