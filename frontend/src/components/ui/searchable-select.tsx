"use client";

import { useState, useMemo } from "react";
import type { Category } from "@/types/finance";

type SearchableSelectProps = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  onAddNew?: (categoryName: string, type: string) => Promise<void>;
  placeholder?: string;
  searchPlaceholder?: string;
};

export function SearchableSelect({
  categories,
  value,
  onChange,
  onAddNew,
  placeholder = "Chọn danh mục",
  searchPlaceholder = "Tìm kiếm danh mục...",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const selectedCategory = categories.find((cat) => cat.id === value);

  const handleAddNew = async () => {
    if (!newCategoryName.trim() || !onAddNew) return;
    try {
      await onAddNew(newCategoryName, "expense");
      setNewCategoryName("");
      setIsAddingNew(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to add category", error);
    }
  };

  return (
    <div className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400"
      >
        <span className="text-sm">
          {selectedCategory?.name || placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
          />

          <div className="max-h-64 overflow-y-auto">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => {
                  onChange(category.id);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
              >
                {category.name}
              </div>
            ))}

            {filteredCategories.length === 0 && !isAddingNew && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50"
              >
                + Thêm "{searchTerm}"
              </button>
            )}

            {isAddingNew && (
              <div className="px-3 py-2 border-t border-gray-200">
                <input
                  type="text"
                  placeholder="Nhập tên danh mục"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNew}
                    className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Thêm
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewCategoryName("");
                    }}
                    className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
