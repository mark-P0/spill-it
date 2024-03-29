import { buildAuthUrl } from "@spill-it/auth/google";
import { redirect } from "react-router-dom";
import { endpoint } from "../utils/endpoints";
import { env, uiHost } from "../utils/env";
import { logger } from "../utils/logger";
import { createLoader } from "../utils/react";
import { isLoggedIn } from "../utils/storage";

export const redirectUri = new URL(endpoint("/login/google/redirect"), uiHost)
  .href;

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

    logger.debug("Building authorization URL...");
    const link = await buildAuthUrl(
      env.VITE_AUTH_GOOGLE_CLIENT_ID,
      redirectUri,
    );

    logger.info("Showing welcome page...");
    return { link };
  },
);
