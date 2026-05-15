import { buildSchedulePdf } from "@/lib/exporters";

export async function GET() {
  return new Response(buildSchedulePdf(), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="horaria-schedule.pdf"'
    }
  });
}
