import { NextResponse } from "next/server";
import { createSessionToken, sessionCookie, shouldUseSecureCookies } from "@/lib/auth";
import { demoUsers } from "@/lib/demo-data";

export async function GET() {
  if (process.env.HORARIA_DEMO_MODE === "false") {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const demoUser = demoUsers.find((user) => user.email === "admin@horaria.demo") ?? demoUsers[0];
  const token = await createSessionToken({
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    role: demoUser.role as "SUPERADMIN" | "CAMPUS_ADMIN" | "SCHEDULER" | "VIEWER",
    status: "ACTIVE",
    selectedCampusId: demoUser.selectedCampusId,
    campusIds: demoUser.campusIds
  });
  const response = NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
