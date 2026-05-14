import { Router } from "express";

import {
	changePassword,
	forgotPassword,
	login,
	me,
	register,
	resetPassword,
	updateProfile,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
	changePasswordRequestSchema,
	forgotPasswordRequestSchema,
	loginRequestSchema,
	registerRequestSchema,
	resetPasswordRequestSchema,
	updateProfileRequestSchema,
} from "../validators/auth.validator";

const authRouter = Router();

authRouter.post("/register", validate(registerRequestSchema), register);
authRouter.post("/login", validate(loginRequestSchema), login);
authRouter.post("/forgot-password", validate(forgotPasswordRequestSchema), forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordRequestSchema), resetPassword);
authRouter.get("/me", requireAuth, me);
authRouter.patch("/profile", requireAuth, validate(updateProfileRequestSchema), updateProfile);
authRouter.post("/change-password", requireAuth, validate(changePasswordRequestSchema), changePassword);

export { authRouter };