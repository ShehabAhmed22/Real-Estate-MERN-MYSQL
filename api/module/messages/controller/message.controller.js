import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/apiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";

export const addMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) throw new ApiError(400, "Message text is required");

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, users: { some: { userId: req.user.id } } },
    });

    if (!chat) throw new ApiError(404, "Chat not found");

    // ✅ FIXED: transaction returns array in order — destructure all 3
    // but we only need message (index 0); the rest just update side-effects
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { text, senderId: req.user.id, chatId },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
        },
      }),
      prisma.chat.update({
        where: { id: chatId },
        data: { lastMessage: text },
      }),
      prisma.chatSeen.deleteMany({ where: { chatId } }),
    ]);

    // ✅ Re-add sender as seen AFTER transaction
    await prisma.chatSeen.create({
      data: { chatId, userId: req.user.id },
    });

    res.status(201).json(new ApiResponse(201, message, "Message sent"));
  } catch (err) {
    next(err);
  }
};
