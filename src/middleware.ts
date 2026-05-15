import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedPrefixes = ["/dashboard", "/teachers", "/courses", "/subjects", "/classrooms", "/constraints", "/scheduler", "/analytics", "/settings", "/superadmin", "/users", "/projects"];
const superadminPrefixes = ["/superadmin"];
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");
const sessionCookie = "horaria_session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const shouldProtect = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!shouldProtect) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookie)?.value;
  if (!token) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/pending-approval", request.url));
    }
    if (superadminPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) && payload.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
