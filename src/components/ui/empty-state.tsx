import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/60 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <Button className="mt-5">{action}</Button>}
    </div>
  );
}
