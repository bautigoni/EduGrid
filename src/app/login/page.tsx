"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@horaria.demo");
  const [password, setPassword] = useState("horaria-demo");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      setError("Invalid credentials. Seed the database or use the demo account.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Card className="glass w-full max-w-md">
        <CardHeader>
          <Link href="/" className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[linear-gradient(135deg,#21d4bd,#60a5fa,#f472b6)]" />
            <span className="text-xl font-bold">Horaria</span>
          </Link>
          <CardTitle>Admin login</CardTitle>
          <p className="text-sm text-muted-foreground">Role-aware access for school administrators and coordinators.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium">
              Email
              <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input className="border-0 px-0 focus-visible:ring-0" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </label>
            <label className="block text-sm font-medium">
              Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Input
                  className="border-0 px-0 focus-visible:ring-0"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </label>
            {error && <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
            <Button className="w-full" size="lg">Login</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
