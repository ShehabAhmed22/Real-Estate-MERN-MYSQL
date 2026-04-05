import { Router } from "express";
import {
  getChats,
  getChatById,
  createChat,
  markChatAsSeen,
} from "../controller/chat.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getChats);
router.get("/:id", authenticate, getChatById);
router.post("/", authenticate, createChat);
router.put("/:id/seen", authenticate, markChatAsSeen);

export default router;
