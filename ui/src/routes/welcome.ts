import { redirect } from "react-router-dom";
import { endpoint } from "../utils/endpoints";
import { logger } from "../utils/logger";
import { createLoader } from "../utils/react";
import { isLoggedIn } from "../utils/storage";

export const welcomeRouteId = "welcome";
export const [loadWelcome, useWelcomeLoader] = createLoader(
  welcomeRouteId,
  async () => {
    logger.debug("Checking if logged in...");
    const canShowHome = await isLoggedIn();
    if (canShowHome) {
      logger.info("Is logged in; redirecting to home page...");
      return redirect(endpoint("/home"));
    }

    logger.info("Showing welcome page...");
    return null;
  },
);
