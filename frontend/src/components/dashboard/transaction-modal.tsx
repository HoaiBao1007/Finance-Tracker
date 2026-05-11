"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toDateInputValue } from "@/lib/format";
import {
  transactionFormSchema,
  type TransactionFormValues,
} from "@/schemas/transaction-form.schema";
import type { Category, Transaction } from "@/types/finance";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

type TransactionModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  categories: Category[];
  initialTransaction?: Transaction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TransactionFormValues) => Promise<void> | void;
};

function buildDefaultValues(transaction?: Transaction | null): TransactionFormValues {
  return {
    categoryId: transaction?.categoryId ?? "",
    amount: transaction?.amount ?? "",
    type: transaction?.type ?? "expense",
    date: toDateInputValue(transaction?.date),
    note: transaction?.note ?? "",
  };
}

export function TransactionModal({
  isOpen,
  mode,
  categories,
  initialTransaction,
  isSubmitting,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: buildDefaultValues(initialTransaction),
  });

  const selectedType = useWatch({
    control,
    name: "type",
  });

  const filteredCategories = categories.filter(
    (category) => category.type === selectedType,
  );

  useEffect(() => {
    if (isOpen) {
      reset(buildDefaultValues(initialTransaction));
    }
  }, [initialTransaction, isOpen, reset]);

  useEffect(() => {
    if (!filteredCategories.some((category) => category.id === initialTransaction?.categoryId)) {
      setValue("categoryId", filteredCategories[0]?.id ?? "");
    }
  }, [filteredCategories, initialTransaction?.categoryId, setValue]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8">
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Transaction modal</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {mode === "create" ? "Tạo giao dịch mới" : "Cập nhật giao dịch"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Form này dùng React Hook Form + Zod và submit trực tiếp vào backend transaction API.
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
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Loại giao dịch
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                {...register("type")}
              >
                <option value="expense">Chi</option>
                <option value="income">Thu</option>
              </select>
              {errors.type ? (
                <span className="text-sm text-orange-700">{errors.type.message}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Category
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                {...register("categoryId")}
              >
                <option value="">Chọn category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId ? (
                <span className="text-sm text-orange-700">{errors.categoryId.message}</span>
              ) : null}
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Số tiền
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                inputMode="numeric"
                placeholder="Ví dụ: 150000"
                {...register("amount")}
              />
              {errors.amount ? (
                <span className="text-sm text-orange-700">{errors.amount.message}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Ngày giao dịch
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                type="date"
                {...register("date")}
              />
              {errors.date ? (
                <span className="text-sm text-orange-700">{errors.date.message}</span>
              ) : null}
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Ghi chú
            <textarea
              className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
              placeholder="Mô tả ngắn cho giao dịch"
              {...register("note")}
            />
            {errors.note ? (
              <span className="text-sm text-orange-700">{errors.note.message}</span>
            ) : null}
          </label>

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
                  ? "Tạo giao dịch"
                  : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}