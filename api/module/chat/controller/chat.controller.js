import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/apiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";

// ─── Get All Chats ─────────────────────────────────────────────────────
export const getChats = async (req, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        // ✅ FIXED: userId not id (UserChat join table field)
        users: { some: { userId: req.user.id } },
      },
      include: {
        users: {
          // ✅ FIXED: include the nested user from join table
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        seenBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Shape: attach receiver + seenByCurrentUser flag
    const shaped = chats.map((chat) => {
      const receiver = chat.users.find((u) => u.userId !== req.user.id)?.user;

      return {
        ...chat,
        receiver,
        seenByCurrentUser: chat.seenBy.some((s) => s.userId === req.user.id),
        lastMessage: chat.messages[0]?.text ?? chat.lastMessage,
      };
    });

    res.json(new ApiResponse(200, shaped, "Chats fetched"));
  } catch (err) {
    next(err);
  }
};

// ─── Get Chat By ID ────────────────────────────────────────────────────
export const getChatById = async (req, res, next) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: {
        id: req.params.id,
        users: { some: { userId: req.user.id } }, // ✅ FIXED
      },
      include: {
        users: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        messages: {
          include: {
            sender: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        seenBy: true,
      },
    });

    if (!chat) throw new ApiError(404, "Chat not found");

    res.json(new ApiResponse(200, chat, "Chat fetched"));
  } catch (err) {
    next(err);
  }
};

// ─── Create Chat ───────────────────────────────────────────────────────
export const createChat = async (req, res, next) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) throw new ApiError(400, "receiverId is required");
    if (receiverId === req.user.id)
      throw new ApiError(400, "Cannot create a chat with yourself");

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) throw new ApiError(404, "Receiver not found");

    // Check existing chat between both users
    const existing = await prisma.chat.findFirst({
      where: {
        AND: [
          { users: { some: { userId: req.user.id } } }, // ✅ FIXED
          { users: { some: { userId: receiverId } } }, // ✅ FIXED
        ],
      },
    });

    if (existing)
      return res.json(new ApiResponse(200, existing, "Chat already exists"));

    const chat = await prisma.chat.create({
      data: {
        // ✅ FIXED: create join table rows, not connect User directly
        users: {
          create: [{ userId: req.user.id }, { userId: receiverId }],
        },
      },
      include: {
        users: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        seenBy: true,
      },
    });

    res.status(201).json(new ApiResponse(201, chat, "Chat created"));
  } catch (err) {
    next(err);
  }
};

// ─── Mark Chat As Seen ─────────────────────────────────────────────────
export const markChatAsSeen = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chat.findFirst({
      where: { id, users: { some: { userId: req.user.id } } }, // ✅ FIXED
      include: { seenBy: true },
    });

    if (!chat) throw new ApiError(404, "Chat not found");

    // ✅ FIXED: seenBy is a relation, not a plain array
    const alreadySeen = chat.seenBy.some((s) => s.userId === req.user.id);

    if (!alreadySeen) {
      await prisma.chatSeen.create({
        data: { chatId: id, userId: req.user.id },
      });
    }

    res.json(new ApiResponse(200, {}, "Chat marked as seen"));
  } catch (err) {
    next(err);
  }
};
