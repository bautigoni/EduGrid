import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { campuses } from "@/lib/demo-data";

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

export function getScopedCampusIds(user: SessionUser) {
  if (user.role === "SUPERADMIN") {
    return campuses.map((campus) => campus.id);
  }
  return user.campusIds;
}

export function getDefaultCampusId(user: SessionUser) {
  const scopedCampusIds = getScopedCampusIds(user);
  if (user.selectedCampusId && scopedCampusIds.includes(user.selectedCampusId)) {
    return user.selectedCampusId;
  }
  return scopedCampusIds[0] ?? null;
}

export function requireCampusAccess(user: SessionUser, campusId: string) {
  if (user.role === "SUPERADMIN") {
    return;
  }
  if (!user.campusIds.includes(campusId)) {
    throw new HttpError(403, "Forbidden");
  }
}

export function resolveCampusScope(user: SessionUser, requestedCampusId?: string | null) {
  const scopedCampusIds = getScopedCampusIds(user);
  if (requestedCampusId) {
    requireCampusAccess(user, requestedCampusId);
    return [requestedCampusId];
  }
  if (user.role === "SUPERADMIN") {
    return scopedCampusIds;
  }
  return scopedCampusIds;
}

export function scopedCampuses(user: SessionUser) {
  const scopedCampusIds = new Set(getScopedCampusIds(user));
  return campuses.filter((campus) => scopedCampusIds.has(campus.id));
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
