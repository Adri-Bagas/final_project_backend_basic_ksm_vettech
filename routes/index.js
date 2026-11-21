import { Router } from "express";
import { sendSuccess } from "../utils/response.js";

let router = Router();

router.get('/', function(req, res, next) {
  sendSuccess(res, { message: "API is running", data: { title: "MyWaifuList API" } });
});

export default router;
