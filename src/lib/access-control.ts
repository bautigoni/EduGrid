import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { getCampusesForUser } from "@/server/repositories/campuses";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getCurrentUser() {
  return getSessionUser();
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, "Authentication required");
  }
  return user;
}

export function requireRole(user: SessionUser, roles: SessionUser["role"][]) {
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden");
  }
}

export function getScopedCampusIds(user: SessionUser): string[] {
  return getCampusesForUser({ id: user.id, role: user.role }).map((c) => c.id);
}

export function getDefaultCampusId(user: SessionUser) {
  const scopedCampusIds = getScopedCampusIds(user);
  if (user.selectedCampusId && scopedCampusIds.includes(user.selectedCampusId)) {
    return user.selectedCampusId;
  }
  return scopedCampusIds[0] ?? null;
}

export function requireCampusAccess(user: SessionUser, campusId: string) {
  if (user.role === "SUPERADMIN") return;
  const scoped = getScopedCampusIds(user);
  if (!scoped.includes(campusId)) {
    throw new HttpError(403, "Forbidden");
  }
}

export function resolveCampusScope(user: SessionUser, requestedCampusId?: string | null) {
  if (requestedCampusId) {
    requireCampusAccess(user, requestedCampusId);
    return [requestedCampusId];
  }
  return getScopedCampusIds(user);
}

export function scopedCampuses(user: SessionUser) {
  return getCampusesForUser({ id: user.id, role: user.role });
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  if (typeof error === "object" && error && "status" in error && typeof error.status === "number") {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ message }, { status: error.status });
  }
  return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
}
