import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
} from "../controller/user.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getAllUsers); // ✅ protected + returns all other users
router.get("/posts", authenticate, getUserPosts); // ← must stay BEFORE /:id
router.get("/:id", authenticate, getUserById);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

export default router;
