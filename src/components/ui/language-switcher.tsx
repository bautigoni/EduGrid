"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/ui/language-provider";

export function LanguageSwitcher() {
  const { locale, mounted, setLocale } = useI18n();
  const visibleLocale = mounted ? locale : "es";

  return (
    <Button aria-label="Language switcher" title="Language switcher" variant="outline" size="sm" onClick={() => setLocale(locale === "es" ? "en" : "es")}>
      <Languages className="h-4 w-4" />
      {visibleLocale === "es" ? "Español" : "English"}
    </Button>
  );
}
