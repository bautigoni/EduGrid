import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken, sessionCookie, shouldUseSecureCookies } from "@/lib/auth";
import { getUserByEmail, getUserCampuses } from "@/server/repositories/users";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");

  let user;
  try {
    user = getUserByEmail(normalizedEmail);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("no such table")) {
      console.error("[login] Database not initialized. Run npm run db:init and npm run db:seed:demo.");
      return NextResponse.json({ message: "El servidor no está inicializado. Contacte al administrador." }, { status: 503 });
    }
    throw err;
  }
  if (!user || !user.password_hash) {
    return NextResponse.json({ message: "Credenciales inválidas." }, { status: 401 });
  }
  const valid = await bcrypt.compare(normalizedPassword, user.password_hash);
  if (!valid) {
    return NextResponse.json({ message: "Credenciales inválidas." }, { status: 401 });
  }
  if (user.status !== "ACTIVE") {
    return NextResponse.json({ message: `Estado de cuenta: ${user.status}`, status: user.status }, { status: 403 });
  }

  const campusIds = getUserCampuses(user.id);
  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role as never,
    status: user.status as never,
    selectedCampusId: campusIds[0] ?? null,
    campusIds
  });
  const response = NextResponse.json({ user: { email: user.email, name: user.full_name, role: user.role } });
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
