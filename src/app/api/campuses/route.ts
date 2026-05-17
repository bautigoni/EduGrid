import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuth, requireRole, scopedCampuses } from "@/lib/access-control";
import { createCampus } from "@/server/repositories/campuses";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json(scopedCampuses(user));
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  display_name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN"]);
    const data = schema.parse(await request.json());
    const campus = createCampus(data);
    return NextResponse.json(campus, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
