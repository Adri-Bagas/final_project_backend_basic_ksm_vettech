import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Waifu } from "../models/Waifu.js";
import { withoutDeleted } from "../utils/userList.js";
import { parsePaging, pageMeta } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const listUsers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePaging(req.query);

    const [users, total] = await Promise.all([
      User.find()
        .select("-email")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("list.waifu_id"),
      User.countDocuments(),
    ]);

    sendSuccess(res, {
      data: users.map(withoutDeleted),
      meta: pageMeta(page, limit, total),
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const getUserBySlug = async (req, res) => {
  try {
    const user = await User.findOne({ slug: req.params.slug })
      .select("-email")
      .populate("list.waifu_id");
    if (!user) return sendError(res, 404, "User not found!");

    sendSuccess(res, { data: withoutDeleted(user) });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const getMyList = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("list.waifu_id");
    if (!user) return sendError(res, 404, "User not found!");

    sendSuccess(res, { data: withoutDeleted(user).list });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const addToList = async (req, res) => {
  try {
    const { waifu_id, note = "" } = req.body;

    if (!mongoose.isValidObjectId(waifu_id)) {
      return sendError(res, 400, "A valid waifu_id is required!");
    }
    if (typeof note !== "string" || note.length > 1000) {
      return sendError(res, 400, "Note must be a string of at most 1000 characters!");
    }

    const waifu = await Waifu.findById(waifu_id);
    if (!waifu) return sendError(res, 404, "Waifu not found!");

    const result = await User.updateOne(
      { _id: req.user.userId, "list.waifu_id": { $ne: waifu._id } },
      { $push: { list: { waifu_id: waifu._id, note } } }
    );

    if (result.modifiedCount === 0) {
      return sendError(res, 409, "Waifu is already on your list!");
    }

    await Waifu.updateOne({ _id: waifu._id }, { $inc: { claims_count: 1 } });

    sendSuccess(res, { status: 201, message: "Added to your list!" });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const updateListNote = async (req, res) => {
  try {
    const { waifuId } = req.params;
    const { note } = req.body;

    if (!mongoose.isValidObjectId(waifuId)) {
      return sendError(res, 400, "Invalid waifu id!");
    }
    if (typeof note !== "string" || note.length > 1000) {
      return sendError(res, 400, "Note must be a string of at most 1000 characters!");
    }

    const result = await User.updateOne(
      { _id: req.user.userId, "list.waifu_id": waifuId },
      { $set: { "list.$.note": note } }
    );

    if (result.matchedCount === 0) {
      return sendError(res, 404, "Waifu is not on your list!");
    }

    sendSuccess(res, { message: "Note updated!" });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const removeFromList = async (req, res) => {
  try {
    const { waifuId } = req.params;

    if (!mongoose.isValidObjectId(waifuId)) {
      return sendError(res, 400, "Invalid waifu id!");
    }

    const result = await User.updateOne(
      { _id: req.user.userId, "list.waifu_id": waifuId },
      { $pull: { list: { waifu_id: waifuId } } }
    );

    if (result.modifiedCount === 0) {
      return sendError(res, 404, "Waifu is not on your list!");
    }

    await Waifu.updateOne(
      { _id: waifuId, claims_count: { $gt: 0 } },
      { $inc: { claims_count: -1 } }
    );

    sendSuccess(res, { message: "Removed from your list!" });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
