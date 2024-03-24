import { buildAuthUrl } from "@spill-it/auth/google";
import { buildHeaderAuth } from "@spill-it/auth/headers";
import { endpoint, endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { apiHost, env } from "../../utils/env";
import { localizeLogger } from "../../utils/logger";
import { TryRouter } from "../try";

const logger = localizeLogger(__filename);

const redirectUri = new URL(endpoint("/try/ui/login/google/redirect"), apiHost)
  .href;

{
  const details = endpointDetails("/try/ui/login/google", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[method](ep, async (req, res, next) => {
    logger.info("Building auth URL...");
    const authUrlResult = await safeAsync(() =>
      buildAuthUrl(env.AUTH_GOOGLE_CLIENT_ID, redirectUri),
    );
    if (!authUrlResult.success) {
      logger.error(formatError(authUrlResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const authUrl = authUrlResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      redirect: authUrl,
    } satisfies Output);
    if (!outputParsing.success) {
      logger.error(formatError(outputParsing.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const output = outputParsing.data;

    logger.info("Packaging output...");
    const rawOutputResult = safe(() => jsonPack(output));
    if (!rawOutputResult.success) {
      logger.error(formatError(rawOutputResult.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const rawOutput = rawOutputResult.value;

    logger.info("Sending login link...");
    return res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/try/ui/login/google/redirect", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { query } = inputParsing.data;

    logger.info("Building header auth...");
    const { code } = query;
    const headerAuthResult = safe(() =>
      buildHeaderAuth("SPILLITGOOGLE", { code, redirectUri }),
    );
    if (!headerAuthResult.success) {
      logger.error(formatError(headerAuthResult.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const headerAuth = headerAuthResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: { code, redirectUri },
      headers: {
        Authorization: headerAuth,
      },
    } satisfies Output);
    if (!outputParsing.success) {
      logger.error(formatError(outputParsing.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const output = outputParsing.data;

    logger.info("Packaging output...");
    const rawOutputResult = safe(() => jsonPack(output));
    if (!rawOutputResult.success) {
      logger.error(formatError(rawOutputResult.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const rawOutput = rawOutputResult.value;

    logger.info("Sending app Google auth...");
    return res.send(rawOutput);
  });
}
