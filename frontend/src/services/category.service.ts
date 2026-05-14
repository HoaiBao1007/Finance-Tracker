import type { CategoryCreateInput, Category } from "@/types/finance";
export async function createCategory(input: CategoryCreateInput): Promise<Category> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create category");
  }

  return response.json();
}