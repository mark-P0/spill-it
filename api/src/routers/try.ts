import { getAllSamples } from "@spill-it/db/tables/samples";
import { endpoint, endpointDetails } from "@spill-it/endpoints";
import { formatError, raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { parseInputFromRequest } from "../utils/endpoints";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const TryRouter = Router();

{
  const details = endpointDetails("/try/hello", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[methodLower](ep, (req, res: Response<Output>, next) => {
    logger.info("Parsing input...");
    const parsingInput = parseInputFromRequest(ep, method, req);
    if (!parsingInput.success) {
      logger.error(formatError(parsingInput.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = parsingInput.value;

    logger.info("Sending response...");
    const { who = "world" } = input.query;
    res.json({ hello: `${who}!` });
  });
}

{
  const details = endpointDetails("/try/samples", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  TryRouter[methodLower](ep, async (req, res: Response<Output>, next) => {
    logger.info("Getting samples from database...");
    const resultSamples = await safeAsync(() => getAllSamples());
    if (!resultSamples.success) {
      logger.error(formatError(resultSamples.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const samples = resultSamples.value;

    logger.info("Sending samples...");
    res.json({ data: samples });
  });
}

TryRouter.get(endpoint("/try/not-found")); // Should not be handled by anything as it shouldn't exist :)
TryRouter.get(endpoint("/try/error"), () => {
  raise("Something went horribly wrong");
});
