import { Router } from "express";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getSavedPosts,
  savePost,
  unsavePost,
} from "../controller/post.controller.js";

import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = Router();

// ─── Saved Posts (must be before /:id to avoid conflict) ──────────────
// GET    /api/posts/saved     → list current user's saved posts
// POST   /api/posts/:id/save  → save a post
// DELETE /api/posts/:id/save  → unsave a post
router.get("/saved", authenticate, getSavedPosts);
router.post("/:id/save", authenticate, savePost);
router.delete("/:id/save", authenticate, unsavePost);

// ─── Posts ─────────────────────────────────────────────────────────────
// GET    /api/posts           → list all posts (filters + pagination)
// POST   /api/posts           → create a post
// GET    /api/posts/:id       → get single post with detail
// PUT    /api/posts/:id       → update post
// DELETE /api/posts/:id       → delete post
router.get("/", getAllPosts);
router.post("/", authenticate, createPost);
router.get("/:id", getPostById);
router.put("/:id", authenticate, updatePost);
router.delete("/:id", authenticate, deletePost);

export default router;
