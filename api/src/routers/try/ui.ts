/* TODO Do this on UI */

import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../auth/google";
import { raise } from "../../utils/errors";
import { buildHeaderAuth, endpoint } from "../../utils/express";
import { localizeLogger } from "../../utils/logger";
import { TryRouter } from "../try";

const logger = localizeLogger(import.meta.url);

// TODO Build this locally? i.e. not depending on incoming requests?
/**
 * This currently depends on incoming requests ("Host" header),
 * which is a security risk as headers can be modified by the client.
 * This is also what Passport.js (and/or the corresponding Google strategy)
 * does in its authentication middleware.
 *
 * Ideally the hostname should be evaluated on startup,
 * but it is not practical as the API will be hosted on a third-party service.
 * I.e. no reliable way of retrieving the hostname in deployment
 * - Render exposes the hostname via an environment variable, which might be a standard enough source,
 *   but the variable name is definitely non-standard. (`RENDER_EXTERNAL_URL`)
 */
function buildBaseUrlFromRequest(req: Request) {
  logger.warn("Building base URL from request...");

  /**
   * - `req.host` is deprecated, which seems to actually provide the hostname only
   * - `req.hostname` does not include the port
   * - `host = hostname + port`
   */
  const host = req.get("Host") ?? raise("Host header does not exist...");

  /**
   * - Express has `req.protocol`
   * - However in deployment (at least on Render) it seems to
   *    always be `"http"`, even if the request actually uses HTTPS
   *   - Might be because of the way how Render manages web services...
   *   - Or because the server in `/bin/www` is HTTP?
   *   - If HTTPS is used, there does not seem to be a way to access their certificates...?
   */
  const protocol = "https";
  logger.warn("Always using HTTPS for base URL...");

  return `${protocol}://${host}`;
}

const _redirectUri = (base: string) =>
  base + endpoint("/try/ui/login/google/redirect");

TryRouter.get(endpoint("/try/ui/login/google"), async (req, res, next) => {
  const redirectUri = _redirectUri(buildBaseUrlFromRequest(req));
  const authUrl = await buildAuthUrl(redirectUri);

  res.json({ redirect: authUrl });
});

TryRouter.get(endpoint("/try/ui/login/google/redirect"), (req, res, next) => {
  const parsing = z.object({ code: z.string() }).safeParse(req.query);
  if (!parsing.success) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid query params" });
    return;
  }

  const redirectUri = _redirectUri(buildBaseUrlFromRequest(req));
  const { code } = parsing.data;

  res.json({
    data: { code, redirectUri },
    headers: {
      Authorization: buildHeaderAuth("SPILLITGOOGLE", { code, redirectUri }),
    },
  });
});
