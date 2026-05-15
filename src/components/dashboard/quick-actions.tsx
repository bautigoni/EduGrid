import { CalendarPlus, FileSpreadsheet, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Button className="justify-start">
          <Sparkles className="h-4 w-4" />
          Generate Schedule
        </Button>
        <Button variant="secondary" className="justify-start">
          <CalendarPlus className="h-4 w-4" />
          Add blocked slot
        </Button>
        <Button variant="secondary" className="justify-start">
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </Button>
        <Button variant="secondary" className="justify-start">
          <Printer className="h-4 w-4" />
          Print layouts
        </Button>
      </CardContent>
    </Card>
  );
}
