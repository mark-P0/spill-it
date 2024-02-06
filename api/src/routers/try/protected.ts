import { parseHeaderAuth } from "@spill-it/auth/headers";
import {
  isSessionExpired,
  readSessionFromUUID,
} from "@spill-it/db/tables/sessions";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { parseInputFromRequest } from "../../utils/endpoints";
import { localizeLogger } from "../../utils/logger";
import { TryRouter } from "../try";

const logger = localizeLogger(__filename);

{
  const details = endpointDetails("/try/unprotected", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[methodLower](ep, async (req, res, next) => {
    logger.info("Sending unprotected resource...");
    const result = safe(() => {
      const output: Output = {
        data: {
          resource: "unprotected",
          access: true,
        },
      };
      const rawOutput = jsonPack(output);
      return res.send(rawOutput);
    });
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
  });
}

{
  const details = endpointDetails("/try/protected", "GET");
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

    const { headers } = input;
    const resultHeaderAuth = safe(() =>
      parseHeaderAuth("SPILLITSESS", headers.Authorization),
    );
    if (!resultHeaderAuth.success) {
      logger.error(formatError(resultHeaderAuth.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const headerAuth = resultHeaderAuth.value;

    logger.info("Fetching session info...");
    const { id } = headerAuth.params;
    const resultSession = await safeAsync(() => readSessionFromUUID(id));
    if (!resultSession.success) {
      logger.error(formatError(resultSession.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const session = resultSession.value;

    logger.info("Verifying session...");
    if (session === null) {
      logger.error("Session does not exist");
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    }
    if (isSessionExpired(session)) {
      logger.error("Session is expired");
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    }

    logger.info("Sending protected resource...");
    const result = safe(() => {
      const output: Output = {
        data: {
          resource: "protected",
          access: id,
        },
      };
      const rawOutput = jsonPack(output);
      return res.send(rawOutput);
    });
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
  });
}
