import { Router } from "express";
import auth from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
import {
  listWaifus,
  leaderboard,
  getWaifu,
  createWaifu,
  updateWaifu,
  addWaifuMedia,
  deleteWaifuMedia,
  deleteWaifu,
} from "../controllers/waifuController.js";

const router = Router();

router.get("/", listWaifus);
router.get("/leaderboard", leaderboard);
router.get("/:id", getWaifu);
router.post("/", auth, upload.array("media", 5), createWaifu);
router.patch("/:id", auth, upload.none(), updateWaifu);
router.post("/:id/media", auth, upload.array("media", 5), addWaifuMedia);
router.delete("/:id/media/:mediaId", auth, deleteWaifuMedia);
router.delete("/:id", auth, deleteWaifu);

export default router;
