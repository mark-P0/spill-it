import { Router } from "express";
import { getAllSamples } from "../data/samples";

export const TryRouter = Router();

TryRouter.get("/hello", (req, res) => {
  const { who = "world" } = req.query;

  res.json({ hello: `${who}!` });
});

TryRouter.get("/sample", async (req, res) => {
  const data = await getAllSamples();

  res.json({ data });
});
