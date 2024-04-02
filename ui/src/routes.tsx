import { buildHeaderAuth } from "@spill-it/auth/headers";
import { raise } from "@spill-it/utils/errors";
import { RouteObject, redirect } from "react-router-dom";
import { z } from "zod";
import { loadProfile, profileRouteId } from "./routes/[profile]";
import {
  FollowersModal,
  FollowingModal,
} from "./routes/[profile]/FollowsModals";
import { ProfileScreen } from "./routes/[profile]/ProfileScreen";
import { EditProfileModal } from "./routes/[profile]/edit-profile/EditProfileModal";
import { App } from "./routes/_app/App";
import { ErrorScreen } from "./routes/_app/ErrorScreen";
import { HomeScreen } from "./routes/home/HomeScreen";
import { loadWelcome, redirectUri, welcomeRouteId } from "./routes/welcome";
import { WelcomeScreen } from "./routes/welcome/WelcomeScreen";
import { endpoint } from "./utils/endpoints";
import { fetchAPI } from "./utils/fetch-api";
import { logger } from "./utils/logger";
import { deleteFromStorage, isLoggedIn, setOnStorage } from "./utils/storage";

const profileRoute: RouteObject = {
  id: profileRouteId,
  path: endpoint("/:username"),
  loader: loadProfile,
  element: <ProfileScreen />,
  children: [
    {
      path: endpoint("/:username/followers"),
      element: <FollowersModal />,
    },
    {
      path: endpoint("/:username/following"),
      element: <FollowingModal />,
    },
    {
      path: endpoint("/:username/edit"),
      element: <EditProfileModal />,
    },
  ],
};

const homeRoute: RouteObject = {
  path: endpoint("/home"),
  element: <HomeScreen />,
  async loader() {
    logger.debug("Checking if logged in...");
    const canShowHome = await isLoggedIn();
    if (!canShowHome) {
      logger.info("Is not logged in; redirecting to welcome page...");
      return redirect(endpoint("/welcome"));
    }

    logger.info("Showing home page...");
    return null;
  },
};

const logoutRoute: RouteObject = {
  path: endpoint("/logout"),
  element: <ErrorScreen />,
  loader() {
    logger.debug("Deleting session info...");
    deleteFromStorage("SESS");

    logger.info("Redirecting to site root...");
    return redirect(endpoint("/"));
  },
};

const loginGoogleRedirectRoute: RouteObject = {
  path: endpoint("/login/google/redirect"),
  element: <ErrorScreen />,
  async loader({ request }) {
    logger.debug("Parsing query string...");
    /** https://github.com/remix-run/react-router/issues/9171#issuecomment-1220717197 */
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const parsing = z.object({ code: z.string() }).safeParse(query);
    const { code } = parsing.success
      ? parsing.data
      : raise(
          "Unexpected query params received on Google login redirect route",
          parsing.error,
        );

    logger.debug("Submitting authorization code for session info...");
    const headerAuth = buildHeaderAuth("SPILLITGOOGLE", { code, redirectUri });
    const result = await fetchAPI("/api/v0/sessions", "GET", {
      headers: { Authorization: headerAuth },
    });
    const { Authorization } = result.success
      ? result.value
      : raise("Failed retrieving session authorization", result.error);

    logger.debug("Storing session info...");
    setOnStorage("SESS", Authorization);

    logger.info("Redirecting to site root...");
    return redirect(endpoint("/"));
  },
};
const loginGuestRoute: RouteObject = {
  path: endpoint("/login/guest"),
  element: <ErrorScreen />,
  async loader() {
    logger.debug("Fetching guest session...");
    const result = await fetchAPI("/api/v0/sessions/guest", "GET", {});
    const { Authorization } = result.success
      ? result.value
      : raise("Failed retrieving guest session", result.error);

    logger.debug("Storing guest session...");
    setOnStorage("SESS", Authorization);

    logger.info("Redirecting to site root...");
    return redirect(endpoint("/"));
  },
};
const welcomeRoute: RouteObject = {
  id: welcomeRouteId,
  path: endpoint("/welcome"),
  element: <WelcomeScreen />,
  loader: loadWelcome,
};

const rootRoute: RouteObject = {
  path: endpoint("/"),
  element: <ErrorScreen />,
  loader() {
    logger.info("Redirecting to home page...");
    return redirect(endpoint("/home"));
  },
};
export const appRoute: RouteObject = {
  element: <App />,
  errorElement: <ErrorScreen />,
  children: [
    {
      errorElement: <ErrorScreen />,
      children: [
        rootRoute,
        welcomeRoute,
        loginGuestRoute,
        loginGoogleRedirectRoute,
        logoutRoute,
        homeRoute,
        profileRoute,
      ],
    },
  ],
};
