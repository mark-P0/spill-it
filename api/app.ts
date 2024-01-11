import cookieParser from "cookie-parser";
import express from "express";
import logger from "morgan";
import path from "path";
import { LoginRouter } from "./routers/login";
import { TryRouter } from "./routers/try";
import { env } from "./utils/env";

export const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

if (env.NODE_ENV === "development") {
  app.use("/try", TryRouter);
}

app.use("/login", LoginRouter);
