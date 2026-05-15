import { DoorOpen, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { classrooms } from "@/lib/demo-data";

export default function ClassroomsPage() {
  return (
    <AppShell title="Classrooms" subtitle="Manage capacity, room type compatibility, and restrictions.">
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Room inventory</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New room
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classrooms.map((room) => (
              <div key={room.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <DoorOpen className="h-4 w-4 text-primary" />
                    {room.name}
                  </div>
                  <Badge>{room.type.replace("_", " ")}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{room.restrictions}</p>
                <div className="mt-4 rounded-xl bg-secondary px-3 py-2 text-sm">{room.capacity} seat capacity</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
