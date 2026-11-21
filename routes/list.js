import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  listUsers,
  getUserBySlug,
  getMyList,
  addToList,
  updateListNote,
  removeFromList,
} from "../controllers/listController.js";

const router = Router();

router.get("/", listUsers);

router.get("/my/list", auth, getMyList);
router.post("/my/list", auth, addToList);
router.patch("/my/list/:waifuId", auth, updateListNote);
router.delete("/my/list/:waifuId", auth, removeFromList);

router.get("/:slug", getUserBySlug);

export default router;
