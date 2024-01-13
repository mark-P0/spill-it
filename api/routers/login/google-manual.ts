import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import {
  buildAuthUrl,
  convertCodeIntoGoogleInfo,
} from "../../auth/google-manual";
import { endpoints } from "../../utils/express";

export const LoginGoogleManualRouter = Router();

LoginGoogleManualRouter.get(
  endpoints.api.v0.login["google-manual"]["/"],
  async (req, res, next) => {
    const authUrl = await buildAuthUrl();

    res.json({ redirect: authUrl });
  }
);

LoginGoogleManualRouter.get(
  endpoints.api.v0.login["google-manual"].redirect,
  async (req, res, next) => {
    const parsing = z.object({ code: z.string() }).safeParse(req.query);
    if (!parsing.success) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid query params" });
      return;
    }
    const { code } = parsing.data;

    const googleInfo = await convertCodeIntoGoogleInfo(code);

    res.json({ data: googleInfo });
  }
);
