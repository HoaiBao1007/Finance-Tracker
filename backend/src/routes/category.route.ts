import { Router } from "express";

import { createCategory, listCategories } from "../controllers/category.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createCategoryRequestSchema, listCategoriesRequestSchema } from "../validators/category.validator";

const categoryRouter = Router();

categoryRouter.use(requireAuth);

categoryRouter.get("/", validate(listCategoriesRequestSchema), listCategories);
categoryRouter.post("/", validate(createCategoryRequestSchema), createCategory);

export { categoryRouter };
