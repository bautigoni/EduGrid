import { buildScheduleCsv } from "@/lib/exporters";

export async function GET() {
  return new Response(buildScheduleCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="horaria-schedule.csv"'
    }
  });
}
