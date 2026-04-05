import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../controller/auth.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import {
  loginLimiter,
  registerLimiter,
} from "../../../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
// /api/auth/register
