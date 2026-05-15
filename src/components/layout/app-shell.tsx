"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  DoorOpen,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Users,
  Workflow
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { CampusSelector } from "@/components/ui/campus-selector";

const nav = [
  { href: "/dashboard", labelKey: "home", icon: Home },
  { href: "/teachers", labelKey: "teachers", icon: Users },
  { href: "/courses", labelKey: "courses", icon: GraduationCap },
  { href: "/subjects", labelKey: "subjects", icon: BookOpen },
  { href: "/classrooms", labelKey: "classrooms", icon: DoorOpen },
  { href: "/projects", labelKey: "projects", icon: Workflow },
  { href: "/dashboard/imports", labelKey: "imports", icon: Upload },
  { href: "/constraints", labelKey: "constraints", icon: ShieldCheck },
  { href: "/scheduler", labelKey: "scheduler", icon: CalendarDays },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/superadmin", labelKey: "superadmin", icon: ShieldCheck },
  { href: "/settings", labelKey: "settings", icon: Settings }
] as const;

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const pathname = usePathname();
  const { t } = useI18n();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card/80 p-4 backdrop-blur-xl lg:block">
        <Link href="/" className="mb-7 flex items-center gap-3 rounded-2xl px-2 py-2">
          <Image
            src="/logo-mark.png"
            alt="Horaria"
            width={42}
            height={42}
            className="h-10 w-10 rounded-xl object-contain shadow-glow"
            priority
          />
          <div>
            <div className="text-xl font-bold">Horaria</div>
            <div className="text-xs text-muted-foreground">IA para horarios escolares</div>
          </div>
        </Link>

        <div className="mb-4 grid grid-cols-[1fr_auto_auto] gap-2">
          <Button size="sm" className="h-11">
            <Sparkles className="h-4 w-4" />
            {t("generate")}
          </Button>
          <Button variant="secondary" size="icon" title="Search">
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>

        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
                  active && "bg-secondary text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
          <div className="rounded-2xl border bg-background/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {t("optimizationReady")}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,#FDBA74,#86EFAC)]" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("demoBalanced")}</p>
          </div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
                <p className="hidden text-sm text-muted-foreground sm:block">{subtitle}</p>
              </div>
            </div>

            <div className="hidden min-w-[260px] items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-sm text-muted-foreground xl:flex">
              <Search className="h-4 w-4" />
              {t("search")}
            </div>

            <div className="flex items-center gap-2">
              <CampusSelector />
              <LanguageSwitcher />
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4" />
                {t("filters")}
              </Button>
              <div className="lg:hidden">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
