import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safeAsync } from "@spill-it/utils/safe";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../auth/google";
import { parseInputFromRequest } from "../utils/endpoints";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const LinksRouter = Router();

{
  const details = endpointDetails("/api/v0/links/google", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  LinksRouter[methodLower](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const parsingInput = parseInputFromRequest(ep, method, req);
    if (!parsingInput.success) {
      logger.error(formatError(parsingInput.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = parsingInput.value;

    logger.info("Building auth URL...");
    const { redirectUri } = input.query;
    const resultAuthUrl = await safeAsync(() => buildAuthUrl(redirectUri));
    if (!resultAuthUrl.success) {
      logger.error(formatError(resultAuthUrl.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const authUrl = resultAuthUrl.value;

    logger.info("Sending auth URL...");
    const output: Output = {
      link: authUrl,
    };
    const rawOutput = jsonPack(output);
    res.send(rawOutput);
  });
}
