import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, Gauge, GraduationCap, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const features = [
  { icon: ShieldCheck, title: "Hard constraint safety", text: "Prevent teacher overlaps, room collisions, invalid rooms, and missing weekly loads." },
  { icon: WandSparkles, title: "Optimization intelligence", text: "Balance daily workload, group modules, reduce gaps, and produce actionable suggestions." },
  { icon: CalendarCheck, title: "Interactive calendars", text: "Inspect schedules by teacher, course, or classroom, then adjust with real-time validation." }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <section className="grid-bg relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(39,211,191,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(96,165,250,0.16),transparent_30%)]" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[linear-gradient(135deg,#21d4bd,#60a5fa,#f472b6)] shadow-glow" />
            <span className="text-xl font-bold">Horaria</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge className="mb-5 border-primary/30 bg-primary/10 text-primary">AI-powered school timetable scheduling</Badge>
            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-normal sm:text-6xl">
              Horaria builds conflict-free school schedules in minutes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Load teachers, courses, subjects, classrooms, and availability constraints. Horaria generates optimized timetables with CP-SAT and keeps humans in control.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open demo dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/scheduler">Try scheduler</Link>
              </Button>
            </div>
          </div>

          <div className="glass rounded-[2rem] p-3">
            <div className="rounded-[1.5rem] border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trimester 1</p>
                  <h2 className="text-xl font-bold">Optimization cockpit</h2>
                </div>
                <Badge className="border-emerald-300 bg-emerald-500/10 text-emerald-600">94 score</Badge>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 30 }).map((_, index) => (
                  <div
                    key={index}
                    className="min-h-20 rounded-xl border bg-secondary/60 p-2"
                    style={index % 5 === 0 ? { background: "linear-gradient(135deg, rgba(39,211,191,.26), rgba(96,165,250,.18))" } : undefined}
                  >
                    {index % 7 === 0 && <div className="h-3 w-12 rounded-full bg-primary/50" />}
                    {index % 5 === 0 && <div className="mt-2 h-8 rounded-lg bg-background/70" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-16 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="glass">
            <CardContent className="p-6">
              <feature.icon className="mb-5 h-8 w-8 text-primary" />
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-4 lg:grid-cols-3">
          {["Starter", "Campus", "Network"].map((tier, index) => (
            <Card key={tier} className={index === 1 ? "border-primary shadow-glow" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{tier}</h3>
                  {index === 1 && <Badge className="border-primary/30 bg-primary/10 text-primary">Popular</Badge>}
                </div>
                <div className="mt-5 text-4xl font-bold">{index === 0 ? "$99" : index === 1 ? "$249" : "Custom"}</div>
                <p className="mt-2 text-sm text-muted-foreground">Per school per month</p>
                <div className="mt-6 space-y-3 text-sm">
                  {["Constraint solver", "Calendar exports", "Version history", "Smart insights"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-[2rem] bg-foreground p-8 text-background md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Sparkles className="mb-4 h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Ready to generate a cleaner school week?</h2>
              <p className="mt-3 max-w-2xl text-background/70">Start with the included demo data or connect PostgreSQL and run your own school constraints.</p>
            </div>
            <Button asChild size="lg">
              <Link href="/dashboard">
                Launch Horaria
                <Gauge className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
