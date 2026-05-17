"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Large centered modal used by Teacher / Course / Subject edit flows.
 * Width: up to 1200px, height: up to 85vh, internal scroll. Fixed header
 * and footer slots are managed by the consumer via `actions` and `footer`.
 */
export function FullScreenModal({
  title,
  subtitle,
  onClose,
  tabs,
  children,
  footer,
  size = "lg"
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const widthClass = size === "xl" ? "max-w-[1400px]" : size === "md" ? "max-w-[820px]" : "max-w-[1200px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true">
      <button aria-label="Cerrar" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative flex max-h-[90vh] w-[92vw] flex-col rounded-2xl border bg-card/95 shadow-2xl backdrop-blur-xl", widthClass)}>
        <header className="flex items-center justify-between border-b bg-[linear-gradient(135deg,rgba(236,253,245,0.7),rgba(255,247,237,0.78))] px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>
        {tabs && <nav className="flex gap-2 overflow-x-auto border-b bg-background/60 px-5 py-2">{tabs}</nav>}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
