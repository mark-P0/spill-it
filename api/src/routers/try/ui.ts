import { endpoint, endpointDetails } from "@spill-it/endpoints";
import { buildHeaderAuth } from "@spill-it/header-auth";
import { formatError, raise } from "@spill-it/utils/errors";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../../auth/google";
import { parseInputFromRequest } from "../../utils/endpoints";
import { env } from "../../utils/env";
import { localizeLogger } from "../../utils/logger";
import { TryRouter } from "../try";

const logger = localizeLogger(__filename);

const baseUrl =
  env.NODE_ENV === "development"
    ? env.HOST_API_DEV
    : env.NODE_ENV === "production"
      ? env.HOST_API_PROD
      : raise("Unknown environment for redirect URI base");
const redirectUri = new URL(endpoint("/try/ui/login/google/redirect"), baseUrl)
  .href;

{
  const details = endpointDetails("/try/ui/login/google", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[methodLower](ep, async (req, res: Response<Output>, next) => {
    logger.info("Building auth URL...");
    const result = await safeAsync(() => buildAuthUrl(redirectUri));
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const url = result.value;

    logger.info("Sending login link...");
    res.json({ redirect: url });
  });
}

{
  const details = endpointDetails("/try/ui/login/google/redirect", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[methodLower](ep, async (req, res: Response<Output>, next) => {
    logger.info("Parsing input...");
    const parsingInput = parseInputFromRequest(ep, method, req);
    if (!parsingInput.success) {
      logger.error(formatError(parsingInput.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = parsingInput.value;

    logger.info("Building header auth...");
    const { code } = input.query;
    const resultHeaderAuth = safe(() =>
      buildHeaderAuth("SPILLITGOOGLE", { code, redirectUri }),
    );
    if (!resultHeaderAuth.success) {
      logger.error(formatError(resultHeaderAuth.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const headerAuth = resultHeaderAuth.value;

    logger.info("Sending app Google auth...");
    res.json({
      data: { code, redirectUri },
      headers: {
        Authorization: headerAuth,
      },
    });
  });
}
