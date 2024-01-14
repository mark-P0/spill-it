import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../auth/google-manual";
import { getAllSamples } from "../data/samples";
import { endpoints } from "../utils/express";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(import.meta.url);

export const TryRouter = Router();

TryRouter.get(endpoints.try.hello, (req, res) => {
  const { who = "world" } = req.query;

  res.json({ hello: `${who}!` });
});

TryRouter.get(endpoints.try.sample, async (req, res) => {
  const data = await getAllSamples();
  logger.debug("Data: " + JSON.stringify(data, undefined, 1));

  res.json({ data });
});

TryRouter.get(endpoints.try["not-found"]); // Should not be handled by anything as it shouldn't exist :)
TryRouter.get(endpoints.try.error, () => {
  throw new Error("Something went horribly wrong");
});

// TODO Do these on UI
{
  TryRouter.get(endpoints.try.ui.login.google["/"], async (req, res, next) => {
    const authUrl = await buildAuthUrl({
      redirectUri:
        "https://localhost:3000" + endpoints.try.ui.login.google.redirect,
    });

    res.json({ redirect: authUrl });
  });
  TryRouter.get(endpoints.try.ui.login.google.redirect, (req, res, next) => {
    const parsing = z.object({ code: z.string() }).safeParse(req.query);
    if (!parsing.success) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid query params" });
      return;
    }

    const { code } = parsing.data;

    res.json({ data: code });
  });
}
