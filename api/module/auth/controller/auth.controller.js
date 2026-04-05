import prisma from "../../../lib/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ApiError } from "../../../utils/apiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";

// ─── Register ─────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, user, "User registered successfully"));
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(400, "Invalid credentials");

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
      })
      .json(new ApiResponse(200, user, "Login successful"));
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────
export const logout = async (req, res, next) => {
  try {
    res
      .clearCookie("token")
      .json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (err) {
    next(err);
  }
};

// ─── Get Me (🔥 ده المهم) ─────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
      },
    });

    if (!user) throw new ApiError(404, "User not found");

    res.json(new ApiResponse(200, user, "User fetched"));
  } catch (err) {
    next(err);
  }
};
