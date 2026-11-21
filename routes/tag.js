import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  listTags,
  suggestTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
} from "../controllers/tagController.js";

const router = Router();

router.get("/", listTags);
router.get("/suggest", suggestTags);
router.get("/:slug", getTag);
router.post("/", auth, createTag);
router.patch("/:slug", auth, updateTag);
router.delete("/:slug", auth, deleteTag);

export default router;
