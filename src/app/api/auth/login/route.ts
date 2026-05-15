import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken, sessionCookie, shouldUseSecureCookies } from "@/lib/auth";
import { demoUsers } from "@/lib/demo-data";

const demoModeEnabled = process.env.HORARIA_DEMO_MODE !== "false";

async function createDemoLogin(email: string, password: string) {
  const demoUser = demoUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!demoModeEnabled || !demoUser || password !== "horaria-demo") {
    return null;
  }
  if (demoUser.status !== "ACTIVE") {
    return NextResponse.json({ message: `Account status: ${demoUser.status}`, status: demoUser.status }, { status: 403 });
  }
  const token = await createSessionToken({
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    role: demoUser.role as "SUPERADMIN" | "CAMPUS_ADMIN" | "SCHEDULER" | "VIEWER",
    status: demoUser.status as "ACTIVE",
    selectedCampusId: demoUser.selectedCampusId,
    campusIds: demoUser.campusIds
  });
  const response = NextResponse.json({ user: demoUser, source: "demo" });
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const normalizedEmail = String(email ?? "").trim();
  const normalizedPassword = String(password ?? "");

  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { campuses: true }
    });
    const valid = user ? await bcrypt.compare(normalizedPassword, user.passwordHash) : false;

    if (!user || !valid) {
      const demoLogin = await createDemoLogin(normalizedEmail, normalizedPassword);
      return demoLogin ?? NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ message: `Account status: ${user.status}`, status: user.status }, { status: 403 });
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      selectedCampusId: user.selectedCampusId,
      campusIds: user.campuses.map((campus) => campus.campusId)
    });

    const response = NextResponse.json({ user: { email: user.email, name: user.name, role: user.role } });
    response.cookies.set(sessionCookie, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookies(),
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch {
    const demoLogin = await createDemoLogin(normalizedEmail, normalizedPassword);
    return demoLogin ?? NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }
}
