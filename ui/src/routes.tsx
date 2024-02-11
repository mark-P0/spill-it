import { buildHeaderAuth } from "@spill-it/auth/headers";
import { raise } from "@spill-it/utils/errors";
import { RouteObject, redirect } from "react-router-dom";
import { z } from "zod";
import { ProfileScreen } from "./routes/[profile]/ProfileScreen";
import { loadProfile, profilePath } from "./routes/[profile]/load-profile";
import { ErrorScreen } from "./routes/_app/ErrorScreen";
import { HomeScreen } from "./routes/home/HomeScreen";
import { WelcomeScreen } from "./routes/welcome/WelcomeScreen";
import { redirectUri } from "./routes/welcome/redirect-uri";
import { endpoint } from "./utils/endpoints";
import { fetchAPI } from "./utils/fetch-api";
import { isLoggedIn } from "./utils/is-logged-in";
import { deleteFromStorage, setOnStorage } from "./utils/storage";

export const ProfileRoute: RouteObject = {
  path: profilePath,
  loader: loadProfile,
  element: <ProfileScreen />,
};

export const HomeRoute: RouteObject = {
  path: endpoint("/home"),
  async loader() {
    const canShowHome = await isLoggedIn();
    if (!canShowHome) {
      return redirect(endpoint("/welcome"));
    }

    return null;
  },
  element: <HomeScreen />,
};

export const LogoutRoute: RouteObject = {
  path: endpoint("/logout"),
  loader() {
    deleteFromStorage("SESS");
    return redirect(endpoint("/"));
  },
  element: null,
};

export const LoginGoogleRedirectRoute: RouteObject = {
  path: endpoint("/login/google/redirect"),
  async loader({ request }) {
    /** https://github.com/remix-run/react-router/issues/9171#issuecomment-1220717197 */
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const parsing = z.object({ code: z.string() }).safeParse(query);
    const { code } = parsing.success
      ? parsing.data
      : raise(
          "Unexpected query params received on Google login redirect route",
          parsing.error,
        );

    /** Convert authorization code to session ID */
    {
      const result = await fetchAPI("/api/v0/sessions", "GET", {
        headers: {
          Authorization: buildHeaderAuth("SPILLITGOOGLE", {
            code,
            redirectUri,
          }),
        },
      });
      const { Authorization } = result.success
        ? result.value
        : raise("Failed retrieving session authorization", result.error);

      setOnStorage("SESS", Authorization);
    }

    return redirect(endpoint("/"));
  },
  element: null,
};
export const WelcomeRoute: RouteObject = {
  path: endpoint("/welcome"),
  async loader() {
    /** Redirect if already logged in */
    {
      const canShowHome = await isLoggedIn();
      if (canShowHome) {
        return redirect(endpoint("/home"));
      }
    }

    return null;
  },
  element: <WelcomeScreen />,
};

export const RootRoute: RouteObject = {
  path: endpoint("/"),
  loader() {
    return redirect(endpoint("/home"));
  },
  element: null,
};
export const AppRoute: RouteObject = {
  errorElement: <ErrorScreen />,
  children: [
    RootRoute,
    WelcomeRoute,
    LoginGoogleRedirectRoute,
    LogoutRoute,
    HomeRoute,
    ProfileRoute,
  ],
};
