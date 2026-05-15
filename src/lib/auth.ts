import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");
export const sessionCookie = "horaria_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "SUPERADMIN" | "CAMPUS_ADMIN" | "SCHEDULER" | "VIEWER";
  status: "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  selectedCampusId?: string | null;
  campusIds: string[];
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(sessionCookie)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionUser;
  } catch {
    return null;
  }
}

export function canAccessRole(user: SessionUser | null, roles: SessionUser["role"][]) {
  return Boolean(user && user.status === "ACTIVE" && roles.includes(user.role));
}
