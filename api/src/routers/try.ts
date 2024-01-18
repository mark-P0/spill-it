import { endpoint, endpointHandler } from "@spill-it/endpoints";
import { Router } from "express";
import { getAllSamples } from "../../data/samples";
import { raise } from "../utils/errors";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(import.meta.url);
export const TryRouter = Router();

TryRouter.get(
  ...endpointHandler("/try/hello", (req, res) => {
    const { who = "world" } = req.query;

    res.json({ hello: `${who}!` });
  })
);

TryRouter.get(
  ...endpointHandler("/try/sample", async (req, res) => {
    const data = await getAllSamples();
    logger.debug("Data: " + JSON.stringify(data, undefined, 1));

    res.json({ data });
  })
);

TryRouter.get(endpoint("/try/not-found")); // Should not be handled by anything as it shouldn't exist :)
TryRouter.get(endpoint("/try/error"), () => {
  raise("Something went horribly wrong");
});
