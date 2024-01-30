import { endpoint, endpointDetails } from "@spill-it/endpoints";
import { buildHeaderAuth } from "@spill-it/header-auth";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../auth/google";
import { parseInputFromRequest } from "../../utils/endpoints";
import { apiHost } from "../../utils/hosts";
import { localizeLogger } from "../../utils/logger";
import { TryRouter } from "../try";

const logger = localizeLogger(__filename);

const redirectUri = new URL(endpoint("/try/ui/login/google/redirect"), apiHost)
  .href;

{
  const details = endpointDetails("/try/ui/login/google", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[methodLower](ep, async (req, res, next) => {
    logger.info("Building auth URL...");
    const result = await safeAsync(() => buildAuthUrl(redirectUri));
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const url = result.value;

    logger.info("Sending login link...");
    const output: Output = {
      redirect: url,
    };
    const rawOutput = jsonPack(output);
    res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/try/ui/login/google/redirect", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[methodLower](ep, async (req, res, next) => {
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
    const output: Output = {
      data: { code, redirectUri },
      headers: {
        Authorization: headerAuth,
      },
    };
    const rawOutput = jsonPack(output);
    res.send(rawOutput);
  });
}
