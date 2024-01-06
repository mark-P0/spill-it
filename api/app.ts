import cookieParser from "cookie-parser";
import express from "express";
import logger from "morgan";
import path from "path";

export const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  const { hello: world = "world" } = req.query;

  res.json({ hello: `${world}!` });
});
