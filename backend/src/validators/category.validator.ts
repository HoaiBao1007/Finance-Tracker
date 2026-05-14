import { z } from "zod";

const transactionTypeSchema = z.enum(["income", "expense"]);

const createCategoryBodySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(50),
  type: transactionTypeSchema,
  isCustom: z.boolean().optional(),
});

const listCategoriesQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
});

export const createCategoryRequestSchema = z.object({
  body: createCategoryBodySchema,
});

export const listCategoriesRequestSchema = z.object({
  query: listCategoriesQuerySchema,
});

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
