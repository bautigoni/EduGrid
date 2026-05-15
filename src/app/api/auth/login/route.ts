import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { demoUsers } from "@/lib/demo-data";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { campuses: true }
    });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
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
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch {
    const demoUser = demoUsers.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
    if (!demoUser || password !== "horaria-demo") {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
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
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    return response;
  }
}
