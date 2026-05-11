import { Router } from "express";

import { login, me, register } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { loginRequestSchema, registerRequestSchema } from "../validators/auth.validator";

const authRouter = Router();

authRouter.post("/register", validate(registerRequestSchema), register);
authRouter.post("/login", validate(loginRequestSchema), login);
authRouter.get("/me", requireAuth, me);

export { authRouter };