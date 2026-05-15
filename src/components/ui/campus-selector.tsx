"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useI18n } from "@/components/ui/language-provider";

type Campus = {
  id: string;
  name: string;
};

export function CampusSelector() {
  const { t } = useI18n();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        const allowedCampuses = Array.isArray(data.campuses) ? data.campuses : [];
        setCampuses(allowedCampuses);
        const stored = window.localStorage.getItem("horaria_selected_campus");
        const next = allowedCampuses.some((campus: Campus) => campus.id === stored)
          ? stored
          : data.user?.selectedCampusId ?? allowedCampuses[0]?.id ?? "";
        setSelected(next);
        if (next) {
          window.localStorage.setItem("horaria_selected_campus", next);
        }
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded || campuses.length === 0) {
    return null;
  }

  if (campuses.length === 1) {
    return (
      <div className="hidden max-w-[220px] items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="truncate font-medium text-foreground">{campuses[0].name}</span>
      </div>
    );
  }

  return (
    <label className="hidden items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
      <Building2 className="h-4 w-4 shrink-0" />
      <span className="sr-only">{t("selectedCampus")}</span>
      <select
        className="max-w-[210px] bg-transparent font-medium text-foreground outline-none"
        value={selected}
        onChange={(event) => {
          setSelected(event.target.value);
          window.localStorage.setItem("horaria_selected_campus", event.target.value);
        }}
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
