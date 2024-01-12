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

TryRouter.get(endpoints.try["not-found"]); // Should not be handled by anything as it shouldn't exist :)
TryRouter.get(endpoints.try.error, () => {
  throw new Error("Something went horribly wrong");
});
