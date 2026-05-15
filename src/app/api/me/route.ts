import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { scopedCampuses } from "@/lib/access-control";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({
    user,
    campuses: user ? scopedCampuses(user) : [],
    isSuperadmin: user?.role === "SUPERADMIN"
  });
}
