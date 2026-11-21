import multer from "multer";
import path from "path";
import fs from "fs";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

["public/images", "public/videos"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.mimetype.startsWith("video/")
      ? "public/videos"
      : "public/images";
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  if ([...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, png, webp, gif, mp4, webm, and mov files allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});
