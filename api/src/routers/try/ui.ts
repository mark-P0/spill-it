/* TODO Do this on UI */

import { endpoint, endpointHandler } from "@spill-it/endpoints";
import { buildHeaderAuth } from "@spill-it/header-auth";
import { raise } from "@spill-it/utils/errors";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../../auth/google";
import { env } from "../../utils/env";
import { TryRouter } from "../try";

const baseUrl =
  env.NODE_ENV === "development"
    ? env.HOST_API_DEV
    : env.NODE_ENV === "production"
      ? env.HOST_API_PROD
      : raise("Unknown environment for redirect URI base");
const redirectUri = new URL(endpoint("/try/ui/login/google/redirect"), baseUrl)
  .href;

TryRouter.get(
  ...endpointHandler("/try/ui/login/google", async (req, res, next) => {
    const authUrl = await buildAuthUrl(redirectUri);

    res.json({ redirect: authUrl });
  }),
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
  }),
);
