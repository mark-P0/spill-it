/* TODO Do this on UI */

import { endpoint } from "@spill-it/endpoints";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../auth/google";
import { env } from "../../utils/env";
import { raise } from "../../utils/errors";
import { buildHeaderAuth } from "../../utils/express";
import { TryRouter } from "../try";

const baseUrl =
  env.NODE_ENV === "development"
    ? env.API_BASE_URL_DEV
    : env.NODE_ENV === "production"
      ? env.API_BASE_URL_PROD
      : raise("Unknown environment for redirect URI base");
const redirectUri = new URL(endpoint("/try/ui/login/google/redirect"), baseUrl)
  .href;

TryRouter.get(endpoint("/try/ui/login/google"), async (req, res, next) => {
  const authUrl = await buildAuthUrl(redirectUri);

  res.json({ redirect: authUrl });
});

TryRouter.get(endpoint("/try/ui/login/google/redirect"), (req, res, next) => {
  const parsing = z.object({ code: z.string() }).safeParse(req.query);
  if (!parsing.success) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid query params" });
    return;
  }
  const { code } = parsing.data;

  res.json({
    data: { code, redirectUri },
    headers: {
      Authorization: buildHeaderAuth("SPILLITGOOGLE", { code, redirectUri }),
    },
  });
});
