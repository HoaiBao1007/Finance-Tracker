"use client";

import { AppState } from "@/components/ui/app-state";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <AppState
          title="Dashboard chưa tải được"
          description={`Đã có lỗi khi dựng dashboard shell. ${error.message}`}
          actionLabel="Thử tải lại"
          onAction={reset}
        />
      </div>
    </main>
  );
}