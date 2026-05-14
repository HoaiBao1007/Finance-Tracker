"use client";

import { useState } from "react";
import { createCategory } from "@/services/category.service";
import { Button } from "@/components/ui/button";

type NewCategorySectionProps = {
  authToken: string;
  onSuccess: (title: string, message: string) => void;
  onError: (message: string) => void;
};

export function NewCategorySection({
  authToken,
  onSuccess,
  onError,
}: NewCategorySectionProps) {
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"expense" | "income">("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      onError("Vui lòng nhập tên danh mục.");
      return;
    }

    if (!authToken.trim()) {
      onError("Cần đăng nhập để thêm danh mục.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      await createCategory({
        name: categoryName,
        type: categoryType,
      });

      setCategoryName("");
      setSuccessMessage(
        `Danh mục "${categoryName}" đã được thêm thành công. Bạn có thể sử dụng nó khi tạo giao dịch.`
      );
      onSuccess("Đã thêm danh mục", `Danh mục "${categoryName}" đã được lưu.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể thêm danh mục. Vui lòng thử lại.";
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Loại danh mục
        <div className="grid grid-cols-2 gap-3 rounded-[22px] bg-slate-100 p-2">
          <button
            className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
              categoryType === "expense"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-600 hover:bg-white/60"
            }`}
            type="button"
            onClick={() => setCategoryType("expense")}
          >
            Khoản chi
          </button>
          <button
            className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
              categoryType === "income"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-600 hover:bg-white/60"
            }`}
            type="button"
            onClick={() => setCategoryType("income")}
          >
            Khoản thu
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Tên danh mục
        <input
          className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
          placeholder="Ví dụ: Giải trí, Du lịch, Ăn uống..."
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          disabled={isSubmitting}
        />
      </label>

      {successMessage && (
        <p className="rounded-[22px] bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          {successMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          className="rounded-full"
          disabled={isSubmitting || !categoryName.trim()}
          type="submit"
        >
          {isSubmitting ? "Đang thêm..." : "Thêm danh mục"}
        </Button>
      </div>
    </form>
  );
}
