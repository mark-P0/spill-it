/* TODO Do this on UI */

import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../auth/google";
import { endpoints } from "../../utils/express";
import { TryRouter } from "../try";

const redirectUri =
  "https://localhost:3000" + endpoints.try.ui.login.google.redirect;

TryRouter.get(endpoints.try.ui.login.google["/"], async (req, res, next) => {
  const authUrl = await buildAuthUrl(redirectUri);

  res.json({ redirect: authUrl });
});
TryRouter.get(endpoints.try.ui.login.google.redirect, (req, res, next) => {
  const parsing = z.object({ code: z.string() }).safeParse(req.query);
  if (!parsing.success) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid query params" });
    return;
  }

  const { code } = parsing.data;

  res.json({
    data: { code, redirectedOn: redirectUri },
    headers: {
      Authorization: `SPILLITGOOGLE code=${code}; redirectedOn=${redirectUri}`,
    },
  });
});
