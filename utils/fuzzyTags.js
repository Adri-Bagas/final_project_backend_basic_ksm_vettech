import Fuse from "fuse.js";

const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

export function rankTags(rawQuery, tags, limit = 5) {
  const query = clean(rawQuery);
  if (!query) return [];

  const docs = tags.map((tag) => ({
    tag,
    slug: tag.slug,
    aliases: tag.aliases || [],
    label: clean(tag.label),
    usage: tag.usage_count || 0,
  }));

  const fuse = new Fuse(docs, {
    keys: ["slug", "aliases", "label"],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
    sortFn: (a, b) => a.score - b.score || b.item.usage - a.item.usage,
  });

  return fuse.search(query, { limit }).map((r) => r.item.tag);
}
