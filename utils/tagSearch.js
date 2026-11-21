import { escapeRegex } from "./escapeRegex.js";
import { normalizeTag } from "./normalizeTag.js";

export const tagSearchFilter = (term) => {
  const conditions = [{ label: { $regex: escapeRegex(term), $options: "i" } }];

  const normalized = normalizeTag(term);
  if (normalized) {
    const re = new RegExp(escapeRegex(normalized));
    conditions.push({ slug: re }, { aliases: re });
  }

  return { $or: conditions };
};
