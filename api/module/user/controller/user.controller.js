import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/apiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import bcrypt from "bcrypt";

// ─── Get All Users (exclude self) ─────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id }, // exclude current user
      },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
      orderBy: { username: "asc" },
    });

    res.json(new ApiResponse(200, users, "Users fetched"));
  } catch (err) {
    next(err);
  }
};

// ─── Get User By ID ────────────────────────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        avatar: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) throw new ApiError(404, "User not found");

    res.json(new ApiResponse(200, user, "User fetched"));
  } catch (err) {
    next(err);
  }
};

// ─── Update User ───────────────────────────────────────────────────────
export const updateUser = async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id)
      throw new ApiError(403, "You can only update your own profile");

    const { password, avatar, username, email } = req.body;

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(avatar && { avatar }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json(new ApiResponse(200, updated, "User updated"));
  } catch (err) {
    next(err);
  }
};

// ─── Delete User ───────────────────────────────────────────────────────
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id)
      throw new ApiError(403, "You can only delete your own account");

    await prisma.user.delete({ where: { id: req.user.id } });

    res.clearCookie("token");
    res.json(new ApiResponse(200, null, "User deleted"));
  } catch (err) {
    next(err);
  }
};

// ─── Get User Posts ────────────────────────────────────────────────────
export const getUserPosts = async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(new ApiResponse(200, { posts }, "Posts fetched"));
  } catch (err) {
    next(err);
  }
};
