import { getAllSamples } from "@spill-it/db/tables/samples";
import { endpoint } from "@spill-it/endpoints";
import { endpointDetails } from "@spill-it/endpoints/index2";
import { formatError, raise } from "@spill-it/utils/errors";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { endpointHandler } from "../utils/endpoint-handler";
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
    const parsing = parseInputFromRequest(ep, method, req);
    if (!parsing.success) {
      logger.error(formatError(parsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = parsing.value;

    logger.info("Sending response...");
    const { who = "world" } = input.query;
    res.json({ hello: `${who}!` });
  });
}

TryRouter.get(
  ...endpointHandler("/try/sample", async (req, res) => {
    const data = await getAllSamples();
    logger.debug("Data: " + JSON.stringify(data, undefined, 1));

    res.json({ data });
  }),
);

TryRouter.get(endpoint("/try/not-found")); // Should not be handled by anything as it shouldn't exist :)
TryRouter.get(endpoint("/try/error"), () => {
  raise("Something went horribly wrong");
});
