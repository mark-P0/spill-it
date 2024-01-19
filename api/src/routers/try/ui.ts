/* TODO Do this on UI */

import { endpoint, endpointHandler } from "@spill-it/endpoints";
import { env } from "@spill-it/env";
import { buildHeaderAuth } from "@spill-it/header-auth";
import { raise } from "@spill-it/utils/errors";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../auth/google";
import { TryRouter } from "../try";

const baseUrl =
  env.NODE_ENV === "development"
    ? env.API_BASE_URL_DEV
    : env.NODE_ENV === "production"
      ? env.API_BASE_URL_PROD
      : raise("Unknown environment for redirect URI base");
const redirectUri = new URL(endpoint("/try/ui/login/google/redirect"), baseUrl)
  .href;

TryRouter.get(
  ...endpointHandler("/try/ui/login/google", async (req, res, next) => {
    const authUrl = await buildAuthUrl(redirectUri);

    res.json({ redirect: authUrl });
  })
);

TryRouter.get(
  ...endpointHandler("/try/ui/login/google/redirect", (req, res, next) => {
    const parsing = z.object({ code: z.string() }).safeParse(req.query);
    if (!parsing.success) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, error: "Invalid query params" });
      return;
    }
    const { code } = parsing.data;

    res.json({
      success: true,
      data: { code, redirectUri },
      headers: {
        Authorization: buildHeaderAuth("SPILLITGOOGLE", { code, redirectUri }),
      },
    });
  })
);
