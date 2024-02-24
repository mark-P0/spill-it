/**
 * The route objects in this file are exported to "silence" ESLint
 * as it seems to see them as React components.
 *
 * They have component-like properties and indeed React Router has a
 * `<Route>` "component" that can be used to the define the routes.
 */

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
import { WelcomeScreen } from "./routes/welcome/WelcomeScreen";
import { redirectUri } from "./routes/welcome/redirect-uri";
import { endpoint } from "./utils/endpoints";
import { fetchAPI } from "./utils/fetch-api";
import { isLoggedIn } from "./utils/is-logged-in";
import { logger } from "./utils/logger";
import { deleteFromStorage, setOnStorage } from "./utils/storage";

export const ProfileRoute: RouteObject = {
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

export const HomeRoute: RouteObject = {
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

export const LogoutRoute: RouteObject = {
  path: endpoint("/logout"),
  element: null,
  loader() {
    logger.debug("Deleting session info...");
    deleteFromStorage("SESS");

    logger.info("Redirecting to site root...");
    return redirect(endpoint("/"));
  },
};

export const LoginGoogleRedirectRoute: RouteObject = {
  path: endpoint("/login/google/redirect"),
  element: null,
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
export const WelcomeRoute: RouteObject = {
  path: endpoint("/welcome"),
  element: <WelcomeScreen />,
  async loader() {
    logger.debug("Checking if logged in...");
    const canShowHome = await isLoggedIn();
    if (canShowHome) {
      logger.info("Is logged in; redirecting to home page...");
      return redirect(endpoint("/home"));
    }

    logger.info("Showing welcome page...");
    return null;
  },
};

export const RootRoute: RouteObject = {
  path: endpoint("/"),
  element: null,
  loader() {
    logger.info("Redirecting to home page...");
    return redirect(endpoint("/home"));
  },
};
export const AppRoute: RouteObject = {
  element: <App />,
  children: [
    {
      errorElement: <ErrorScreen />,
      children: [
        RootRoute,
        WelcomeRoute,
        LoginGoogleRedirectRoute,
        LogoutRoute,
        HomeRoute,
        ProfileRoute,
      ],
    },
  ],
};
