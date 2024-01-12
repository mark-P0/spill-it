import { Router } from "express";
import { getAllSamples } from "../data/samples";
import { endpoints } from "../utils/express";

export const TryRouter = Router();

TryRouter.get(endpoints.try.hello, (req, res) => {
  const { who = "world" } = req.query;

  res.json({ hello: `${who}!` });
});

TryRouter.get(endpoints.try.sample, async (req, res) => {
  const data = await getAllSamples();

  res.json({ data });
});
