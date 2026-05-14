import { type Prisma, type TransactionType } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";
import type { CreateCategoryBody, ListCategoriesQuery } from "../validators/category.validator";

const categorySelect = {
  id: true,
  userId: true,
  name: true,
  type: true,
  isCustom: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

type AccessibleCategory = Prisma.CategoryGetPayload<{
  select: typeof categorySelect;
}>;

const normalizeCategoryName = (value: string) => value.trim().replace(/\s+/g, " ");

const accessibleCategoryFilter = (userId: string, categoryId: string): Prisma.CategoryWhereInput => ({
  id: categoryId,
  OR: [{ userId }, { userId: null }],
});

export const ensureAccessibleCategory = async (
  userId: string,
  categoryId: string,
  expectedType?: TransactionType
) => {
  const category = await prisma.category.findFirst({
    where: accessibleCategoryFilter(userId, categoryId),
    select: categorySelect,
  });

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  if (expectedType && category.type !== expectedType) {
    throw new AppError(
      `Category \"${category.name}\" does not support ${expectedType} transactions`,
      400,
      "CATEGORY_TYPE_MISMATCH"
    );
  }

  return category;
};

export const categoryService = {
  listCategories: async (userId: string, query: ListCategoriesQuery) => {
    return prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: null, isDefault: true }],
        ...(query.type ? { type: query.type } : {}),
      },
      select: categorySelect,
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  },

  createCategory: async (userId: string, input: CreateCategoryBody) => {
    const normalizedName = normalizeCategoryName(input.name);

    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        type: input.type,
        name: {
          equals: normalizedName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (existingCategory) {
      throw new AppError("Category already exists", 409, "CATEGORY_ALREADY_EXISTS");
    }

    return prisma.category.create({
      data: {
        userId,
        name: normalizedName,
        type: input.type,
        isDefault: false,
      },
      select: categorySelect,
    });
  },

  ensureAccessibleCategory,
};

export type { AccessibleCategory };
