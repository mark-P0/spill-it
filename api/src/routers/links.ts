import { buildAuthUrl } from "@spill-it/auth/google";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const LinksRouter = Router();

{
  const details = endpointDetails("/api/v0/links/google", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  LinksRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const parsingInput = signature.input.safeParse(req);
    if (!parsingInput.success) {
      logger.error(formatError(parsingInput.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = parsingInput.data;

    logger.info("Building auth URL...");
    const { redirectUri } = input.query;
    const resultAuthUrl = await safeAsync(() => buildAuthUrl(redirectUri));
    if (!resultAuthUrl.success) {
      logger.error(formatError(resultAuthUrl.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const authUrl = resultAuthUrl.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      link: authUrl,
    } satisfies Output);
    if (!outputParsing.success) {
      logger.error(formatError(outputParsing.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const output = outputParsing.data;

    logger.info("Sending auth URL...");
    const result = safe(() => {
      const rawOutput = jsonPack(output);
      return res.send(rawOutput);
    });
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
  });
}
