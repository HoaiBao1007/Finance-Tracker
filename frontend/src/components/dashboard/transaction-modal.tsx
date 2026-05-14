"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toDateInputValue } from "@/lib/format";
import {
  transactionFormSchema,
  type TransactionFormValues,
} from "@/schemas/transaction-form.schema";
import type { Category, Transaction } from "@/types/finance";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createCategory } from "@/services/category.service";
import { SearchableSelect } from "@/components/ui/searchable-select";

type TransactionModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  categories: Category[];
  initialTransaction?: Transaction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onCategoriesUpdated?: (categories: Category[]) => void;
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
  categories: propsCategories,
  initialTransaction,
  isSubmitting,
  onClose,
  onCategoriesUpdated,
  onSubmit,
}: TransactionModalProps) {
  const [categories, setCategories] = useState<Category[]>(propsCategories);

  useEffect(() => {
    setCategories(propsCategories);
  }, [propsCategories]);

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

  const selectedCategoryId = useWatch({
    control,
    name: "categoryId",
  });

  const filteredCategories = categories.filter(
    (category) => category.type === selectedType,
  );

  const transactionCopy =
    selectedType === "income"
      ? {
          heading: mode === "create" ? "Tạo khoản thu mới" : "Cập nhật khoản thu",
          description: "Khoản thu được nhập riêng để bạn theo dõi nguồn tiền vào độc lập với chi tiêu.",
          categoryLabel: "Danh mục thu nhập",
          amountPlaceholder: "Ví dụ: 12000000",
          notePlaceholder: "Ví dụ: Lương tháng, thưởng, hoàn tiền",
          submitLabel: mode === "create" ? "Lưu khoản thu" : "Lưu khoản thu",
        }
      : {
          heading: mode === "create" ? "Tạo khoản chi mới" : "Cập nhật khoản chi",
          description: "Khoản chi được lưu tách biệt để dashboard đọc đúng dòng tiền ra theo từng danh mục.",
          categoryLabel: "Danh mục chi tiêu",
          amountPlaceholder: "Ví dụ: 150000",
          notePlaceholder: "Ví dụ: Mua sắm, ăn uống, thanh toán hóa đơn",
          submitLabel: mode === "create" ? "Lưu khoản chi" : "Lưu khoản chi",
        };

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

  const handleAddNewCategory = async (name: string, type: string) => {
    try {
      const newCategory = await createCategory({
        name,
        type: type as "expense" | "income",
      });
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      if (onCategoriesUpdated) {
        onCategoriesUpdated(updatedCategories);
      }
      setValue("categoryId", newCategory.id);
    } catch (error) {
      console.error("Failed to add category", error);
    }
  };

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
              {transactionCopy.heading}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {transactionCopy.description}
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
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">{transactionCopy.categoryLabel}</label>
              <SearchableSelect
                categories={filteredCategories}
                value={selectedCategoryId}
                onChange={(categoryId) => setValue("categoryId", categoryId)}
                onAddNew={handleAddNewCategory}
                placeholder={`Chọn ${transactionCopy.categoryLabel.toLowerCase()}`}
              />
              {errors.categoryId && (
                <p className="text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Loại giao dịch</span>
              <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-100 p-2">
                <button
                  className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                    selectedType === "expense"
                      ? "bg-white text-rose-600 shadow-sm"
                      : "text-slate-600 hover:bg-white/60"
                  }`}
                  type="button"
                  onClick={() => setValue("type", "expense", { shouldValidate: true, shouldDirty: true })}
                >
                  Khoản chi
                </button>
                <button
                  className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                    selectedType === "income"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-600 hover:bg-white/60"
                  }`}
                  type="button"
                  onClick={() => setValue("type", "income", { shouldValidate: true, shouldDirty: true })}
                >
                  Khoản thu
                </button>
              </div>
              <input type="hidden" {...register("type")} />
              {errors.type ? (
                <span className="text-sm text-orange-700">{errors.type.message}</span>
              ) : null}
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              {transactionCopy.categoryLabel}
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
                <option value="add-new-category">+ Thêm danh mục mới</option>
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
                placeholder={transactionCopy.amountPlaceholder}
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
              placeholder={transactionCopy.notePlaceholder}
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
                : transactionCopy.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}