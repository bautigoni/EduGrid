"use client";

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
  Menu,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/classrooms", label: "Classrooms", icon: DoorOpen },
  { href: "/constraints", label: "Constraints", icon: ShieldCheck },
  { href: "/scheduler", label: "Scheduler", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card/80 p-4 backdrop-blur-xl lg:block">
        <Link href="/" className="mb-7 flex items-center gap-3 rounded-2xl px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#21d4bd,#60a5fa,#f472b6)] shadow-glow" />
          <div>
            <div className="text-xl font-bold">Horaria</div>
            <div className="text-xs text-muted-foreground">School scheduling AI</div>
          </div>
        </Link>

        <div className="mb-4 grid grid-cols-[1fr_auto_auto] gap-2">
          <Button size="sm" className="h-11">
            <Sparkles className="h-4 w-4" />
            Generate
          </Button>
          <Button variant="secondary" size="icon" title="Search">
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>

        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Optimization ready
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,#86efac,#27d3bf)]" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Demo data is 78% constraint-balanced.</p>
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

            <div className="hidden min-w-[260px] items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
              <Search className="h-4 w-4" />
              Search teachers, courses, rooms
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
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
