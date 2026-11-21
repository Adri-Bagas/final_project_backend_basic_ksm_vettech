import { Tag } from "../models/Tag.js";

export function normalizeTag(raw) {
  let clean = raw
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "")
    .replace(/[^a-z0-9]/g, "");

  if (clean.length > 4 && clean.endsWith("s") && !clean.endsWith("ss")) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

export async function resolveTags(rawInput) {
  const rawList = Array.isArray(rawInput)
    ? rawInput
    : typeof rawInput === "string"
    ? rawInput.split(",")
    : [];

  const slugs = new Set();

  for (const raw of rawList) {
    const norm = normalizeTag(raw);
    if (!norm) continue;

    let tag = await Tag.findOne({
      $or: [{ slug: norm }, { aliases: norm }],
    });

    if (!tag) {
      // slug is unique, so a soft-deleted tag holding it must be revived instead of re-inserted
      tag = await Tag.findOneAndUpdate(
        { slug: norm, deleted_at: { $ne: null } },
        {
          $set: {
            label: raw.trim(),
            aliases: [norm],
            usage_count: 0,
            created_by: null,
            deleted_at: null,
          },
        },
        { returnDocument: "after", includeDeleted: true }
      );
    }

    if (!tag) {
      tag = await Tag.findOneAndUpdate(
        { slug: norm },
        {
          $setOnInsert: {
            slug: norm,
            label: raw.trim(),
            aliases: [norm],
          },
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    slugs.add(tag.slug);
  }

  return [...slugs];
}
