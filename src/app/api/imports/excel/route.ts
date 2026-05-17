import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { jsonError, requireAuth, requireCampusAccess, requireRole } from "@/lib/access-control";
import { runExcelImport, type ImportMode, type SheetRows } from "@/server/imports/excelEngine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, ["SUPERADMIN", "COORDINADOR_HORARIOS", "CAMPUS_ADMIN", "SCHEDULER"]);
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const campusId = (form.get("campusId") as string | null) ?? "";
    const mode = ((form.get("mode") as string | null) ?? "merge") as ImportMode;
    if (!file) return NextResponse.json({ message: "Falta el archivo .xlsx." }, { status: 400 });
    if (!campusId) return NextResponse.json({ message: "Falta campusId." }, { status: 400 });
    requireCampusAccess(user, campusId);

    const buf = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buf, { type: "buffer" });
    const sheetRows: SheetRows = {};
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false }) as Record<string, string>[];
      // Strip rows where every value is empty so the engine's `detected` counts stay honest.
      const filtered = rows.filter((r) => Object.values(r).some((v) => String(v ?? "").trim() !== ""));
      sheetRows[sheetName] = filtered;
    }

    const summary = runExcelImport(sheetRows, campusId, mode);
    return NextResponse.json(summary, { status: summary.ok ? 200 : 400 });
  } catch (error) {
    return jsonError(error);
  }
}
