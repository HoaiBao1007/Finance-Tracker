"use client";

import { useState } from "react";
import { createCategory } from "@/services/category.service";
import { useRouter } from "next/navigation";

export function NewCategory() {
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmitting(true);
    try {
      await createCategory({ name: categoryName, type: categoryType as "expense" | "income" });
      setCategoryName("");
      router.refresh(); // Refresh the page to show the new category
    } catch (error) {
      console.error("Failed to create category", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
          Tên danh mục mới
        </label>
        <input
          id="categoryName"
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Nhập tên danh mục"
        />
      </div>

      <div>
        <label htmlFor="categoryType" className="block text-sm font-medium text-gray-700">
          Loại danh mục
        </label>
        <select
          id="categoryType"
          value={categoryType}
          onChange={(e) => setCategoryType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="expense">Khoản chi</option>
          <option value="income">Khoản thu</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isSubmitting ? "Đang thêm..." : "Thêm danh mục"}
      </button>
    </form>
  );
}