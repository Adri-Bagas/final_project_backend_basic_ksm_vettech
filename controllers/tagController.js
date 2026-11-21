import { Tag } from "../models/Tag.js";
import { Waifu } from "../models/Waifu.js";
import { normalizeTag } from "../utils/normalizeTag.js";
import { rankTags } from "../utils/fuzzyTags.js";
import { parseAliases, findConflict } from "../utils/tagAliases.js";
import { tagSearchFilter } from "../utils/tagSearch.js";
import { isSameId } from "../utils/ownership.js";
import { parsePaging, pageMeta } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const listTags = async (req, res) => {
  try {
    const { page, limit, skip } = parsePaging(req.query);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter = search ? tagSearchFilter(search) : {};

    const [tags, total] = await Promise.all([
      Tag.find(filter).sort({ usage_count: -1, label: 1, _id: 1 }).skip(skip).limit(limit),
      Tag.countDocuments(filter),
    ]);
    sendSuccess(res, { data: tags, meta: pageMeta(page, limit, total) });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const suggestTags = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return sendError(res, 400, "Query parameter q is required!");

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);
    const tags = await Tag.find().select("slug label aliases usage_count").lean();

    sendSuccess(res, { data: rankTags(q, tags, limit) });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const getTag = async (req, res) => {
  try {
    const tag = await Tag.findOne({ slug: req.params.slug.toLowerCase() });
    if (!tag) return sendError(res, 404, "Tag not found!");
    sendSuccess(res, { data: tag });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const createTag = async (req, res) => {
  try {
    const label = typeof req.body.label === "string" ? req.body.label.trim() : "";
    const slug = normalizeTag(label);
    if (!label || !slug) {
      return sendError(res, 400, "A valid label is required!");
    }

    const aliases = parseAliases(req.body.aliases, slug);

    if (await findConflict(aliases)) {
      return sendError(res, 409, "Tag or alias already exists!");
    }

    // slug is unique, so reuse a soft-deleted tag holding it instead of inserting
    const revived = await Tag.findOneAndUpdate(
      { slug, deleted_at: { $ne: null } },
      {
        $set: {
          label,
          aliases,
          usage_count: 0,
          created_by: req.user.userId,
          deleted_at: null,
        },
      },
      { returnDocument: "after", includeDeleted: true }
    );
    if (revived) {
      return sendSuccess(res, { status: 201, message: "Tag created!", data: revived });
    }

    const tag = await Tag.create({ slug, label, aliases, created_by: req.user.userId });
    sendSuccess(res, { status: 201, message: "Tag created!", data: tag });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, "Tag or alias already exists!");
    }
    sendError(res, 500, err.message);
  }
};

export const updateTag = async (req, res) => {
  try {
    const tag = await Tag.findOne({ slug: req.params.slug.toLowerCase() });
    if (!tag) return sendError(res, 404, "Tag not found!");

    if (!isSameId(tag.created_by, req.user.userId)) {
      return sendError(res, 403, "Only the creator can edit this tag!");
    }

    const { label, aliases } = req.body;

    if (label !== undefined) {
      if (typeof label !== "string" || !label.trim()) {
        return sendError(res, 400, "Label cannot be empty!");
      }
      tag.label = label.trim();
    }

    if (aliases !== undefined) {
      const newAliases = parseAliases(aliases, tag.slug);
      if (await findConflict(newAliases, tag._id)) {
        return sendError(res, 409, "An alias is already used by another tag!");
      }
      tag.aliases = newAliases;
    }

    await tag.save();
    sendSuccess(res, { message: "Tag updated!", data: tag });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, "Tag or alias already exists!");
    }
    sendError(res, 500, err.message);
  }
};

export const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findOne({ slug: req.params.slug.toLowerCase() });
    if (!tag) return sendError(res, 404, "Tag not found!");

    if (!isSameId(tag.created_by, req.user.userId)) {
      return sendError(res, 403, "Only the creator can delete this tag!");
    }

    const inUse = await Waifu.countDocuments({ tags: tag.slug });
    if (inUse > 0) {
      return sendError(res, 409, `Tag is still used by ${inUse} waifu(s)!`);
    }

    tag.deleted_at = new Date();
    tag.usage_count = 0;
    await tag.save();

    sendSuccess(res, { message: "Tag deleted!" });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
