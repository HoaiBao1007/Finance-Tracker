import type { RequestHandler } from "express";

import { categoryService } from "../services/category.service";
import { sendSuccess } from "../utils/api-response";
import type { CreateCategoryBody, ListCategoriesQuery } from "../validators/category.validator";

export const listCategories: RequestHandler = async (req, res, next) => {
  try {
    const query = (res.locals.validatedQuery ?? req.query) as ListCategoriesQuery;
    const categories = await categoryService.listCategories(req.user!.id, query);
    return sendSuccess(res, categories, "Categories fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const createCategory: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.user!.id, req.body as CreateCategoryBody);
    return sendSuccess(res, category, "Category created successfully", 201);
  } catch (error) {
    next(error);
  }
};
