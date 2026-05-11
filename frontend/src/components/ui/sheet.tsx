"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "left",
  className,
}: SheetProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] lg:hidden">
      <button
        aria-label="Đóng menu điều hướng"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        type="button"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute bottom-0 top-0 flex w-full max-w-[360px] flex-col bg-slate-800 text-white shadow-[0_24px_80px_rgba(15,23,42,0.35)] transition",
          side === "left" ? "left-0" : "right-0",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Đóng drawer"
            className="rounded-full border border-white/10 p-2 text-slate-200 transition hover:bg-white/5"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}