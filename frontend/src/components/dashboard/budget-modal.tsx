"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { budgetFormSchema, type BudgetFormValues } from "@/schemas/budget-form.schema";
import type { Budget, Category } from "@/types/finance";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type BudgetModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  categories: Category[];
  initialBudget?: Budget | null;
  periodLabel: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: BudgetFormValues) => Promise<void> | void;
};

function buildDefaultValues(
  budget?: Budget | null,
  fallbackCategoryId = "",
): BudgetFormValues {
  return {
    categoryId: budget?.categoryId ?? fallbackCategoryId,
    limitAmount: budget?.limitAmount ?? "",
  };
}

export function BudgetModal({
  isOpen,
  mode,
  categories,
  initialBudget,
  periodLabel,
  isSubmitting,
  onClose,
  onSubmit,
}: BudgetModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: buildDefaultValues(initialBudget, categories[0]?.id ?? ""),
  });

  useEffect(() => {
    if (isOpen) {
      reset(buildDefaultValues(initialBudget, categories[0]?.id ?? ""));
    }
  }, [categories, initialBudget, isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8">
      <div className="panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[32px] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Budget modal</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {mode === "create" ? "Tạo ngân sách mới" : "Cập nhật ngân sách"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ngân sách này sẽ áp dụng cho kỳ {periodLabel} và chỉ dành cho category chi tiêu.
            </p>
          </div>
          <button
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Đóng
          </button>
        </div>

        <form className="mt-8 grid gap-5" onSubmit={handleSubmit((values) => onSubmit(values))}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Category chi tiêu
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
              {...register("categoryId")}
            >
              <option value="">Chọn category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <span className="text-sm text-orange-700">{errors.categoryId.message}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Hạn mức
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
              inputMode="numeric"
              placeholder="Ví dụ: 2500000"
              {...register("limitAmount")}
            />
            {errors.limitAmount ? (
              <span className="text-sm text-orange-700">{errors.limitAmount.message}</span>
            ) : null}
          </label>

          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">Kỳ áp dụng</p>
            <p className="mt-1">{periodLabel}</p>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "create"
                  ? "Đang tạo"
                  : "Đang cập nhật"
                : mode === "create"
                  ? "Tạo ngân sách"
                  : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}