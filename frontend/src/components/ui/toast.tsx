"use client";

import { useEffect, useState } from "react";

type ToastTone = "success" | "error" | "info";

export type ToastState = {
  id: number;
  tone: ToastTone;
  title: string;
  message: string;
};

type ToastProps = {
  toast: ToastState | null;
  queuedCount?: number;
  onDismiss: (toastId: ToastState["id"]) => void;
};

const EXIT_TRANSITION_MS = 180;

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-rose-200 bg-rose-50 text-rose-950",
  info: "border-blue-200 bg-blue-50 text-blue-950",
};

const accentStyles: Record<ToastTone, string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  info: "bg-blue-500",
};

export function Toast({ toast, queuedCount = 0, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (!toast) {
      setIsVisible(false);
      setIsDismissing(false);
      return undefined;
    }

    setIsVisible(false);
    setIsDismissing(false);

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [toast]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsDismissing(true);
      setIsVisible(false);
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  useEffect(() => {
    if (!toast || !isDismissing) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onDismiss(toast.id);
    }, EXIT_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isDismissing, onDismiss, toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] w-full max-w-sm px-4 sm:bottom-6 sm:right-6">
      <div
        className={`pointer-events-auto overflow-hidden rounded-[24px] border shadow-2xl transition duration-200 ease-out ${toneStyles[toast.tone]} ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-start gap-4 p-4">
          <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${accentStyles[toast.tone]}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="mt-1 text-sm leading-6 opacity-80">{toast.message}</p>
            {queuedCount > 0 ? (
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
                Còn {queuedCount} thông báo chờ
              </p>
            ) : null}
          </div>
          <button
            className="rounded-full px-2 py-1 text-sm font-semibold opacity-70 transition hover:opacity-100"
            type="button"
            onClick={() => {
              setIsDismissing(true);
              setIsVisible(false);
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}