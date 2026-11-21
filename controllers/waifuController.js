import mongoose from "mongoose";
import { Waifu } from "../models/Waifu.js";
import { Tag } from "../models/Tag.js";
import { User } from "../models/User.js";
import { findOrCreateSeries } from "../utils/findOrCreateSeries.js";
import { resolveTags } from "../utils/normalizeTag.js";
import { tagSearchFilter } from "../utils/tagSearch.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { parsePaging, pageMeta } from "../utils/pagination.js";
import { isSameId } from "../utils/ownership.js";
import { MAX_MEDIA, removeFiles, toMedia, removeMediaFiles } from "../utils/mediaFiles.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const listWaifus = async (req, res) => {
  try {
    const { search, sort } = req.query;
    const { page, limit, skip } = parsePaging(req.query);

    if (search !== undefined && typeof search !== "string") {
      return sendError(res, 400, "search must be a single text value!");
    }

    const filter = {};
    const term = search?.trim();
    if (term) {
      const text = { $regex: escapeRegex(term), $options: "i" };
      const matchedTags = await Tag.find(tagSearchFilter(term)).select("slug").lean();
      filter.$or = [
        { name: text },
        { series: text },
        { tags: { $in: matchedTags.map((t) => t.slug) } },
      ];
    }

    const sortBy =
      sort === "name" ? { name: 1 } :
      sort === "popular" ? { claims_count: -1, name: 1 } :
      { createdAt: -1 };

    const [data, total] = await Promise.all([
      Waifu.find(filter).sort(sortBy).skip(skip).limit(limit),
      Waifu.countDocuments(filter),
    ]);

    sendSuccess(res, {
      data,
      meta: pageMeta(page, limit, total),
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const leaderboard = async (req, res) => {
  try {
    const { limit } = parsePaging(req.query, 10);
    const data = await Waifu.find()
      .sort({ claims_count: -1, name: 1 })
      .limit(limit);

    sendSuccess(res, { data: data.map((w, i) => ({ rank: i + 1, ...w.toObject() })) });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const getWaifu = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid waifu id!");
    }

    const waifu = await Waifu.findById(id);
    if (!waifu) return sendError(res, 404, "Waifu not found!");

    sendSuccess(res, { data: waifu });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const createWaifu = async (req, res) => {
  const files = req.files || [];
  try {
    const { name, series, series_type, tags } = req.body;

    if (!name || !name.trim() || !series || !series.trim()) {
      removeFiles(files);
      return sendError(res, 400, "Name and series are required!");
    }
    if (files.length === 0) {
      return sendError(res, 400, "At least one image or video is required!");
    }

    const media = toMedia(files, req.user.userId);

    const seriesDoc = await findOrCreateSeries(series, series_type || undefined);
    const slugs = await resolveTags(tags);

    const waifu = await Waifu.create({
      name,
      series_id: seriesDoc._id,
      series: seriesDoc.title,
      tags: slugs,
      media,
      created_by: req.user.userId,
    });

    if (slugs.length) {
      await Tag.updateMany({ slug: { $in: slugs } }, { $inc: { usage_count: 1 } });
    }

    sendSuccess(res, { status: 201, message: "Waifu created!", data: waifu });
  } catch (err) {
    removeFiles(files);
    if (err.code === 11000) {
      return sendError(res, 409, "This waifu already exists in that series!");
    }
    if (err.name === "ValidationError") {
      return sendError(res, 400, err.message);
    }
    sendError(res, 500, err.message);
  }
};

export const updateWaifu = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid waifu id!");
    }

    const waifu = await Waifu.findById(id);
    if (!waifu) {
      return sendError(res, 404, "Waifu not found!");
    }
    if (!isSameId(waifu.created_by, req.user.userId)) {
      return sendError(res, 403, "Only the creator can edit this waifu!");
    }

    const { name, series, series_type, tags } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return sendError(res, 400, "Name cannot be empty!");
      }
      waifu.name = name;
    }

    if (series !== undefined) {
      if (!String(series).trim()) {
        return sendError(res, 400, "Series cannot be empty!");
      }
      const seriesDoc = await findOrCreateSeries(series, series_type || undefined);
      waifu.series_id = seriesDoc._id;
      waifu.series = seriesDoc.title;
    }

    let addedTags = [];
    let removedTags = [];
    if (tags !== undefined) {
      const oldSlugs = waifu.tags;
      const newSlugs = await resolveTags(tags);
      addedTags = newSlugs.filter((s) => !oldSlugs.includes(s));
      removedTags = oldSlugs.filter((s) => !newSlugs.includes(s));
      waifu.tags = newSlugs;
    }

    await waifu.save();

    if (addedTags.length) {
      await Tag.updateMany({ slug: { $in: addedTags } }, { $inc: { usage_count: 1 } });
    }
    if (removedTags.length) {
      await Tag.updateMany(
        { slug: { $in: removedTags }, usage_count: { $gt: 0 } },
        { $inc: { usage_count: -1 } }
      );
    }

    sendSuccess(res, { message: "Waifu updated!", data: waifu });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, "This waifu already exists in that series!");
    }
    if (err.name === "ValidationError") {
      return sendError(res, 400, err.message);
    }
    sendError(res, 500, err.message);
  }
};

export const addWaifuMedia = async (req, res) => {
  const files = req.files || [];
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      removeFiles(files);
      return sendError(res, 400, "Invalid waifu id!");
    }
    if (files.length === 0) {
      return sendError(res, 400, "At least one image or video is required!");
    }

    const waifu = await Waifu.findById(id);
    if (!waifu) {
      removeFiles(files);
      return sendError(res, 404, "Waifu not found!");
    }

    const remaining = MAX_MEDIA - waifu.media.length;
    if (files.length > remaining) {
      removeFiles(files);
      return sendError(
        res,
        409,
        `A waifu can have at most ${MAX_MEDIA} media; only ${Math.max(remaining, 0)} more can be added!`
      );
    }

    const result = await Waifu.updateOne(
      { _id: waifu._id, [`media.${MAX_MEDIA - files.length}`]: { $exists: false } },
      { $push: { media: { $each: toMedia(files, req.user.userId) } } }
    );
    if (result.modifiedCount === 0) {
      removeFiles(files);
      return sendError(res, 409, `A waifu can have at most ${MAX_MEDIA} media!`);
    }

    sendSuccess(res, {
      status: 201,
      message: "Media added!",
      data: await Waifu.findById(waifu._id),
    });
  } catch (err) {
    removeFiles(files);
    sendError(res, 500, err.message);
  }
};

export const deleteWaifuMedia = async (req, res) => {
  try {
    const { id, mediaId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(mediaId)) {
      return sendError(res, 400, "Invalid waifu or media id!");
    }

    const waifu = await Waifu.findById(id);
    if (!waifu) return sendError(res, 404, "Waifu not found!");

    const media = waifu.media.id(mediaId);
    if (!media) return sendError(res, 404, "Media not found on this waifu!");

    const owner = media.uploaded_by || waifu.created_by;
    if (!isSameId(owner, req.user.userId)) {
      return sendError(res, 403, "Only the user who uploaded this media can delete it!");
    }

    const result = await Waifu.updateOne(
      { _id: waifu._id, "media._id": media._id, "media.1": { $exists: true } },
      { $pull: { media: { _id: media._id } } }
    );
    if (result.modifiedCount === 0) {
      return sendError(res, 400, "A waifu needs at least one image or video!");
    }

    removeMediaFiles([media]);

    sendSuccess(res, {
      message: "Media deleted!",
      data: await Waifu.findById(waifu._id),
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const deleteWaifu = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid waifu id!");
    }

    const waifu = await Waifu.findById(id);
    if (!waifu) return sendError(res, 404, "Waifu not found!");

    if (!isSameId(waifu.created_by, req.user.userId)) {
      return sendError(res, 403, "Only the creator can delete this waifu!");
    }

    waifu.deleted_at = new Date();
    await waifu.save();

    await User.updateMany({ "list.waifu_id": waifu._id }, { $pull: { list: { waifu_id: waifu._id } } });

    if (waifu.tags.length) {
      await Tag.updateMany(
        { slug: { $in: waifu.tags }, usage_count: { $gt: 0 } },
        { $inc: { usage_count: -1 } }
      );
    }

    sendSuccess(res, { message: "Waifu deleted!" });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
