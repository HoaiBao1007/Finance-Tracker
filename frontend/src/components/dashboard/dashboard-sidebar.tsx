"use client";

import { BackendConnectionCard } from "@/components/dashboard/backend-connection-card";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AuthPayload, AuthUser, DashboardSnapshot } from "@/types/finance";

type NavigationItem = {
  sectionId: string;
  label: string;
  caption: string;
  active: boolean;
};

type DashboardSidebarProps = {
  navigationItems: NavigationItem[];
  sourceLabel: string;
  budgetPeriodLabel: string;
  currentPeriodLabel: string;
  recentTransactionsCount: number;
  filters: DashboardSnapshot["filters"];
  source: DashboardSnapshot["source"];
  currentUser: AuthUser | null;
  isSyncing: boolean;
  errorMessage: string | null;
  helperMessage: string | null;
  onAuthenticated: (payload: AuthPayload, mode: "login" | "register") => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  variant?: "desktop" | "mobile";
  onNavigate?: (sectionId: string) => void;
};

export function DashboardSidebar({
  navigationItems,
  sourceLabel,
  budgetPeriodLabel,
  currentPeriodLabel,
  recentTransactionsCount,
  filters,
  source,
  currentUser,
  isSyncing,
  errorMessage,
  helperMessage,
  onAuthenticated,
  onDisconnect,
  onRefresh,
  variant = "desktop",
  onNavigate,
}: DashboardSidebarProps) {
  const isMobile = variant === "mobile";

  const content = (
    <CardContent className={isMobile ? "flex flex-col gap-5 p-4" : "flex flex-col gap-6 p-5 sm:p-6"}>
      <div
        className={`rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(59,130,246,0.22),rgba(15,23,42,0.12))] ${
          isMobile ? "p-4" : "p-5"
        }`}
      >
        <Badge className="bg-blue-500 text-white">Finance Tracker</Badge>
        <h1 className={`mt-4 font-semibold tracking-tight ${isMobile ? "text-2xl" : "text-3xl"}`}>
          Dashboard
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {isMobile
            ? "Điều hướng nhanh, đổi kỳ và quản lý kết nối backend ngay trong drawer mobile."
            : "Sidebar cố định giữ điều hướng, bộ lọc kỳ và trạng thái kết nối để phần nội dung chính tập trung cho số dư và biểu đồ."}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Điều hướng
          </p>
          {isMobile ? (
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Chạm vào từng mục để nhảy đến đúng section trong dashboard.
            </p>
          ) : null}
        </div>

        <nav className="grid gap-2">
          {navigationItems.map((item) => (
            <Button
              key={item.sectionId}
              aria-current={item.active ? "page" : undefined}
              className={`h-auto justify-between rounded-[22px] text-left ${
                isMobile ? "px-4 py-3.5" : "px-4 py-4"
              }`}
              size={isMobile ? "default" : "lg"}
              variant={item.active ? "sidebarActive" : "sidebar"}
              onClick={() => onNavigate?.(item.sectionId)}
            >
              <span className="flex flex-col items-start gap-1">
                <span className="text-sm font-semibold">{item.label}</span>
                <span
                  className={`text-xs leading-5 ${
                    item.active ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {item.caption}
                </span>
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  item.active ? "bg-white" : "bg-slate-500"
                }`}
              />
            </Button>
          ))}
        </nav>
      </div>

      <Separator className="bg-white/10" />

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Tóm tắt nhanh
        </p>
        <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "sm:grid-cols-3 lg:grid-cols-1"}`}>
          <Card className="border-white/10 bg-white/5 text-white shadow-none">
            <CardContent className={isMobile ? "p-3.5" : "p-4"}>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Nguồn dữ liệu</p>
              <p className="mt-2 text-base font-semibold">{sourceLabel}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white shadow-none">
            <CardContent className={isMobile ? "p-3.5" : "p-4"}>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kỳ đang xem</p>
              <p className="mt-2 text-base font-semibold">{budgetPeriodLabel}</p>
            </CardContent>
          </Card>
          <Card className={`border-white/10 bg-white/5 text-white shadow-none ${isMobile ? "col-span-2" : ""}`}>
            <CardContent className={isMobile ? "p-3.5" : "p-4"}>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Giao dịch gần đây</p>
              <p className="mt-2 text-base font-semibold">{recentTransactionsCount}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Thiết lập kỳ
        </p>
        <DashboardFilterBar
          layout="sidebar"
          month={filters.month}
          year={filters.year}
          source={source}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Kết nối backend
        </p>
        <BackendConnectionCard
          onAuthenticated={onAuthenticated}
          onDisconnect={onDisconnect}
          onRefresh={onRefresh}
          currentUser={currentUser}
          source={source}
          periodLabel={currentPeriodLabel}
          isLoading={isSyncing}
          errorMessage={errorMessage}
          helperMessage={helperMessage}
        />
      </div>
    </CardContent>
  );

  if (variant === "mobile") {
    return content;
  }

  return (
    <Card className="overflow-hidden rounded-[36px] border-slate-700/30 bg-slate-800 text-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
      {content}
    </Card>
  );
}