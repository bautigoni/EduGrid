import { Lightbulb, WandSparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insights } from "@/lib/demo-data";

export function InsightPanel() {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WandSparkles className="h-5 w-5 text-primary" />
          Smart insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div key={`insight-${index}-${insight.slice(0, 24)}`} className="flex gap-3 rounded-2xl border bg-background/70 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm text-muted-foreground">{insight}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
