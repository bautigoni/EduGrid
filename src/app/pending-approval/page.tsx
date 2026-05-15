import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PendingApprovalPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#FFF7ED,#F0FDF4)] p-6 dark:bg-background dark:bg-none">
      <Card className="glass max-w-lg">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
            <Clock3 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Solicitud pendiente de aprobacion</h1>
          <p className="mt-3 text-muted-foreground">
            Tu cuenta fue creada, pero aun necesita aprobacion de la institucion. Cuando sea aprobada podras ingresar al panel interno.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Volver al login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
