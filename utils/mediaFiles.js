import fs from "fs";
import path from "path";

export const MAX_MEDIA = 20;

export const removeFiles = (files = []) => {
  for (const f of files) {
    fs.unlink(path.resolve(f.path), () => {});
  }
};

export const toMedia = (files, userId) =>
  files.map((f) => {
    const isVideo = f.mimetype.startsWith("video/");
    return {
      url: `/${isVideo ? "videos" : "images"}/${f.filename}`,
      type: isVideo ? "video" : "image",
      uploaded_by: userId,
    };
  });

export const removeMediaFiles = (items = []) => {
  for (const m of items) {
    fs.unlink(path.join("public", m.url), () => {});
  }
};
