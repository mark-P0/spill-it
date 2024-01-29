import { endpointDetails } from "@spill-it/endpoints/index2";
import { formatError } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../auth/google";
import { endpointHandler } from "../utils/endpoint-handler";
import { parseInputFromRequest } from "../utils/endpoints";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const LinksRouter = Router();

// LinksRouter.get(
//   ...endpointHandler("/api/v0/links/google", async (req, res, next) => {
//     const parsingQuery = z
//       .object({ redirectUri: z.string().url() })
//       .safeParse(req.query);
//     if (!parsingQuery.success) {
//       logger.error(formatError(parsingQuery.error));
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ success: false, error: "Invalid query" });
//     }
//     const query = parsingQuery.data;
//
//     const resultAuthUrl = await safeAsync(() =>
//       buildAuthUrl(query.redirectUri),
//     );
//     if (!resultAuthUrl.success) {
//       logger.error(formatError(resultAuthUrl.error));
//       return res
//         .status(StatusCodes.BAD_GATEWAY)
//         .json({ success: false, error: "Create URL failed" });
//     }
//     const authUrl = resultAuthUrl.value;
//
//     logger.info("Responding with authorization URL...");
//     res.json({ success: true, link: authUrl });
//   }),
// );
{
  const details = endpointDetails("/api/v0/links/google", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  LinksRouter[methodLower](ep, async (req, res: Response<Output>, next) => {
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
    res.json({ link: authUrl });
  });
}
