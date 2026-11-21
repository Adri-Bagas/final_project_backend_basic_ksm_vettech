import { Series } from "../models/Series.js";

function toSeriesSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
}

export async function findOrCreateSeries(rawTitle, type = "anime") {
  const cleanTitle = rawTitle.trim();
  const slug = toSeriesSlug(cleanTitle);

  return await Series.findOneAndUpdate(
    { slug },
    {
      $setOnInsert: {
        title: cleanTitle,
        slug,
        type,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );
}
