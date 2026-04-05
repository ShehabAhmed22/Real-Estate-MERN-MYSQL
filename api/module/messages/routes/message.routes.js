import { Router } from "express";
import { addMessage } from "../controller/message.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.post("/:chatId", authenticate, addMessage);

export default router;
