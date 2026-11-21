import { Tag } from "../models/Tag.js";
import { normalizeTag } from "./normalizeTag.js";

export const parseAliases = (raw, slug) => {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  const aliases = list
    .filter((a) => typeof a === "string")
    .map(normalizeTag)
    .filter(Boolean);
  return [...new Set([slug, ...aliases])];
};

export const findConflict = (values, excludeId) =>
  Tag.findOne({
    ...(excludeId && { _id: { $ne: excludeId } }),
    $or: [{ slug: { $in: values } }, { aliases: { $in: values } }],
  });
