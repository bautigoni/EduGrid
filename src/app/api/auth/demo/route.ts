import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSessionToken, sessionCookie, shouldUseSecureCookies } from "@/lib/auth";
import { getCampusesForUser } from "@/server/repositories/campuses";
import { getUserByEmail } from "@/server/repositories/users";

export async function GET() {
  // Sign in as the first superadmin in the database (created by seed).
  let user = getUserByEmail("admin@horaria.demo") ?? getUserByEmail("admin@horaria.local");
  if (!user) {
    const row = getDb().prepare("SELECT * FROM users WHERE role = 'SUPERADMIN' ORDER BY created_at LIMIT 1").get() as
      | { id: string; full_name: string; email: string; role: string; status: string }
      | undefined;
    if (row) user = { ...row, password_hash: "", created_at: "", updated_at: "" } as never;
  }
  if (!user) {
    return NextResponse.json({ message: "No hay superadmin disponible. Ejecutá npm run db:seed:clean." }, { status: 503 });
  }
  const campuses = getCampusesForUser({ id: user.id, role: user.role });
  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role as never,
    status: "ACTIVE",
    selectedCampusId: campuses[0]?.id ?? null,
    campusIds: campuses.map((c) => c.id)
  });
  const response = NextResponse.redirect(new URL("/planner", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
