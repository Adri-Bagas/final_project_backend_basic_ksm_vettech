import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import logger from "morgan";
import swaggerUi from "swagger-ui-express";
import fs from "fs";

import indexRouter from "./routes/index.js";
import listsRouter from "./routes/list.js";
import authRouter from "./routes/auth.js";
import waifuRouter from "./routes/character.js";
import tagRouter from "./routes/tag.js";
import { sendError } from "./utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/lists", listsRouter);
app.use("/waifus", waifuRouter);
app.use("/tags", tagRouter);

// Who even need this api?
if (process.env.NODE_ENV !== "production") {
    const swaggerPath = new URL("./swagger-output.json", import.meta.url);
    if (fs.existsSync(swaggerPath)) {
        const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
}

app.use((req, res) => {
    sendError(res, 404, "Route not found!");
});

app.use((err, req, res, next) => {
    if (err.name === "MulterError" || err.message?.startsWith("Only jpg")) {
        return sendError(res, 400, err.message);
    }
    console.error(err);
    sendError(res, err.status || 500, err.message || "Internal server error");
});

export default app;
