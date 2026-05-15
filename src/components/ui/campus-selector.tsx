"use client";

import { Building2 } from "lucide-react";
import { campuses } from "@/lib/demo-data";
import { useI18n } from "@/components/ui/language-provider";

export function CampusSelector() {
  const { t } = useI18n();

  return (
    <label className="hidden items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
      <Building2 className="h-4 w-4" />
      <span className="sr-only">{t("selectedCampus")}</span>
      <select
        className="max-w-[210px] bg-transparent font-medium text-foreground outline-none"
        defaultValue={campuses[0].id}
        onChange={(event) => window.localStorage.setItem("horaria_selected_campus", event.target.value)}
      >
        {campuses.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}
          </option>
        ))}
      </select>
    </label>
  );
}
