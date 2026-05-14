import axios from "axios";
import type { CategoryCreateInput, Category } from "@/types/finance";

export async function createCategory(input: CategoryCreateInput): Promise<Category> {
  const response = await axios.post<Category>("/api/categories", input);
  return response.data;
}