import cookieParser from "cookie-parser";
import express from "express";
import logger from "morgan";
import path from "path";
import { IndexRouter } from "./routes";
import { UsersRouter } from "./routes/users";

export const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", IndexRouter);
app.use("/users", UsersRouter);
