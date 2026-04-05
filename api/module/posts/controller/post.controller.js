import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/apiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { Pagination } from "../../../utils/pagination.js";

// ─── Get All Posts ─────────────────────────────────────────────────────
export const getAllPosts = async (req, res, next) => {
  try {
    const { city, type, property, minPrice, maxPrice, bedroom } = req.query;

    const where = {
      ...(city && { city: { contains: city } }), // removed mode:"insensitive" — not supported in MySQL
      ...(type && { type }),
      ...(property && { property }),
      ...(bedroom && { bedroom: parseInt(bedroom) }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      }),
    };

    const total = await prisma.post.count({ where });
    const pagination = new Pagination({ ...req.query, total });

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      ...pagination.prismaArgs,
    });

    // Parse images JSON for each post
    const parsedPosts = posts.map((post) => ({
      ...post,
      images: parseImages(post.images),
    }));

    res.json(
      new ApiResponse(
        200,
        { posts: parsedPosts, meta: pagination.getMeta() },
        "Posts fetched",
      ),
    );
  } catch (err) {
    next(err);
  }
};

// ─── Get Post By ID ────────────────────────────────────────────────────
export const getPostById = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        postDetail: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    if (!post) throw new ApiError(404, "Post not found");

    res.json(
      new ApiResponse(
        200,
        { ...post, images: parseImages(post.images) },
        "Post fetched",
      ),
    );
  } catch (err) {
    next(err);
  }
};

// ─── Create Post ───────────────────────────────────────────────────────
export const createPost = async (req, res, next) => {
  try {
    const { postData, postDetail } = req.body;

    if (!postData) throw new ApiError(400, "Missing post data");

    const {
      title,
      price,
      images,
      address,
      city,
      bedroom,
      bathroom,
      latitude,
      longitude,
      type,
      property,
    } = postData;

    if (!title || !price || !address || !city || !type || !property) {
      throw new ApiError(400, "Missing required post fields");
    }

    const post = await prisma.post.create({
      data: {
        title,
        price: parseFloat(price),
        images: JSON.stringify(images || []), // store as JSON string for MySQL
        address,
        city,
        bedroom: parseInt(bedroom),
        bathroom: parseInt(bathroom),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        type,
        property,
        userId: req.user.id,
        ...(postDetail && {
          postDetail: { create: postDetail },
        }),
      },
      include: { postDetail: true },
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { ...post, images: parseImages(post.images) },
          "Post created successfully",
        ),
      );
  } catch (err) {
    next(err);
  }
};

// ─── Update Post ───────────────────────────────────────────────────────
export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Post not found");
    if (existing.userId !== req.user.id) {
      throw new ApiError(403, "You can only update your own posts");
    }

    const postData = req.body.postData || req.body;
    const postDetail = req.body.postDetail;

    const {
      title,
      price,
      images,
      address,
      city,
      bedroom,
      bathroom,
      latitude,
      longitude,
      type,
      property,
    } = postData;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(price && { price: parseFloat(price) }),
        ...(images && { images: JSON.stringify(images) }),
        ...(address && { address }),
        ...(city && { city }),
        ...(bedroom && { bedroom: parseInt(bedroom) }),
        ...(bathroom && { bathroom: parseInt(bathroom) }),
        ...(latitude && { latitude: parseFloat(latitude) }),
        ...(longitude && { longitude: parseFloat(longitude) }),
        ...(type && { type }),
        ...(property && { property }),
        ...(postDetail && {
          postDetail: {
            upsert: { create: postDetail, update: postDetail },
          },
        }),
      },
      include: { postDetail: true },
    });

    res.json(
      new ApiResponse(
        200,
        { ...post, images: parseImages(post.images) },
        "Post updated successfully",
      ),
    );
  } catch (err) {
    next(err);
  }
};

// ─── Delete Post ───────────────────────────────────────────────────────
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Post not found");
    if (existing.userId !== req.user.id) {
      throw new ApiError(403, "You can only delete your own posts");
    }

    await prisma.post.delete({ where: { id } });

    res.json(new ApiResponse(200, null, "Post deleted successfully"));
  } catch (err) {
    next(err);
  }
};

// ─── Get Saved Posts ───────────────────────────────────────────────────
export const getSavedPosts = async (req, res, next) => {
  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: req.user.id },
      include: {
        post: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsed = savedPosts.map((s) => ({
      ...s,
      post: { ...s.post, images: parseImages(s.post.images) },
    }));

    res.json(new ApiResponse(200, parsed, "Saved posts fetched"));
  } catch (err) {
    next(err);
  }
};

// ─── Save Post ─────────────────────────────────────────────────────────
export const savePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "Post not found");

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: req.user.id, postId } },
    });
    if (existing) throw new ApiError(409, "Post already saved");

    const saved = await prisma.savedPost.create({
      data: { userId: req.user.id, postId },
      include: { post: true },
    });

    res
      .status(201)
      .json(new ApiResponse(201, saved, "Post saved successfully"));
  } catch (err) {
    next(err);
  }
};

// ─── Unsave Post ───────────────────────────────────────────────────────
export const unsavePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: req.user.id, postId } },
    });
    if (!existing) throw new ApiError(404, "Saved post not found");

    await prisma.savedPost.delete({
      where: { userId_postId: { userId: req.user.id, postId } },
    });

    res.json(new ApiResponse(200, null, "Post removed from saved"));
  } catch (err) {
    next(err);
  }
};

// ─── Helper ────────────────────────────────────────────────────────────
function parseImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  }
  return [];
}
