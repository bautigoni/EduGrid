"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  KeyRound,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Workflow,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/ui/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { CampusSelector } from "@/components/ui/campus-selector";

const mainNav = [
  { href: "/planner", labelKey: "planner", icon: CalendarDays },
  { href: "/dashboard", labelKey: "home", icon: Home },
  { href: "/teachers", labelKey: "teachers", icon: Users },
  { href: "/courses", labelKey: "courses", icon: GraduationCap },
  { href: "/subjects", labelKey: "subjects", icon: BookOpen },
  { href: "/projects", labelKey: "projects", icon: Workflow },
  { href: "/dashboard/imports", labelKey: "imports", icon: Upload },
  { href: "/constraints", labelKey: "constraints", icon: ShieldCheck },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 }
] as const;

const adminNav = [
  { href: "/superadmin", labelKey: "superadmin", icon: ShieldCheck },
  { href: "/superadmin/invitation-codes", labelKey: "invitationCodes", icon: KeyRound }
] as const;

type UserPayload = {
  role: "SUPERADMIN" | "CAMPUS_ADMIN" | "SCHEDULER" | "VIEWER" | "COORDINADOR_HORARIOS";
} | null;

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  onClick
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center rounded-xl text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active && "bg-secondary text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
  user
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  user: UserPayload;
}) {
  const { t } = useI18n();
  const isSuperadmin = user?.role === "SUPERADMIN";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className={cn("flex min-w-0 items-center rounded-2xl py-2", collapsed ? "justify-center" : "gap-3 px-2")}>
            <Image src="/logo-mark.png" alt="Horaria" width={42} height={42} className="h-10 w-10 shrink-0 rounded-xl object-contain" priority />
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-xl font-bold">Horaria</div>
                <div className="truncate text-xs text-muted-foreground">{t("schoolSchedulingAi")}</div>
              </div>
            )}
          </Link>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={onToggle} title={collapsed ? "Expandir menu" : "Plegar menu"}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className={cn("mt-4 grid gap-2", collapsed ? "grid-cols-1" : "grid-cols-[1fr_auto_auto]")}>
          <Button size={collapsed ? "icon" : "sm"} className="h-11" title={t("generate")}>
            <Sparkles className="h-4 w-4" />
            {!collapsed && t("generate")}
          </Button>
          <Button variant="secondary" size="icon" title="Buscar">
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-1">
          {mainNav.map((item) => (
            <NavLink key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} collapsed={collapsed} onClick={onNavigate} />
          ))}
        </div>
        {isSuperadmin && (
          <div className="mt-4 border-t pt-4">
            <div className={cn("mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground", collapsed && "sr-only")}>Admin</div>
            {adminNav.map((item) => (
              <NavLink key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} collapsed={collapsed} onClick={onNavigate} />
            ))}
          </div>
        )}
      </nav>

      <footer className="shrink-0 border-t p-4">
        <div className="flex flex-col gap-1">
          <NavLink href="/settings" label={t("settings")} icon={Settings} collapsed={collapsed} onClick={onNavigate} />
          <Button variant="ghost" className={cn("min-h-11", collapsed ? "justify-center px-2" : "justify-start px-3")} onClick={logout} title={t("logout")}>
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="truncate">{t("logout")}</span>}
          </Button>
        </div>
        {!collapsed && (
          <div className="mt-3 rounded-2xl border bg-background/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t("optimizationReady")}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,#FDBA74,#86EFAC)]" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("demoBalanced")}</p>
          </div>
        )}
      </footer>
    </div>
  );
}

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserPayload>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((response) => response.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  const sidebarWidth = useMemo(() => (collapsed ? "md:pl-20" : "md:pl-72"), [collapsed]);

  return (
    <div className="min-h-screen bg-background">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r bg-card/88 backdrop-blur-xl transition-all md:block", collapsed ? "w-20" : "w-72")}>
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} user={user} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Cerrar menu" className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[min(86vw,320px)] border-r bg-card shadow-2xl">
            <div className="absolute right-3 top-3 z-10">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent collapsed={false} onToggle={() => setCollapsed((value) => !value)} onNavigate={() => setMobileOpen(false)} user={user} />
          </aside>
        </div>
      )}

      <main className={cn("transition-[padding] duration-300", sidebarWidth)}>
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="secondary" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
                <p className="hidden max-w-[70ch] truncate text-sm text-muted-foreground sm:block">{subtitle}</p>
              </div>
            </div>

            <div className="hidden min-w-[220px] items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-sm text-muted-foreground xl:flex">
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("search")}</span>
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              <CampusSelector />
              <LanguageSwitcher />
              <div className="md:hidden">
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
