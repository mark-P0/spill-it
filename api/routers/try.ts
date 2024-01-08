import { Router } from "express";

export const TryRouter = Router();

TryRouter.get("/hello", (req, res) => {
  const { who = "world" } = req.query;

  res.json({ hello: `${who}!` });
});
