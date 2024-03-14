/**
 * The route objects in this file are exported to "silence" ESLint
 * as it seems to see them as React components.
 *
 * They have component-like properties and indeed React Router has a
 * `<Route>` "component" that can be used to the define the routes.
 */

import { zodUserPublic } from "@spill-it/db/schema/zod";
import { ensureError, raise } from "@spill-it/utils/errors";
import { Result } from "@spill-it/utils/safe";
import { zodOfType } from "@spill-it/utils/zod";
import { RouteObject } from "react-router-dom";
import { z } from "zod";
import { fetchAPI } from "../utils/fetch-api";
import { ErrorScreen } from "./_app/ErrorScreen";

async function fetchProfile(username: string) {
  const profileResult = await fetchAPI("/api/v0/users", "GET", {
    query: { username },
  });
  const profiles = profileResult.success
    ? profileResult.value.data
    : raise("Failed fetching profile info");

  if (profiles.length > 1) raise("Multiple users for a username...?");
  const profile = profiles[0] ?? raise("Username possibly does not exist");

  return profile;
}

type UsersLoaderResult = Result<z.infer<typeof zodUserPublic>>;
export const zodUsersLoader = zodOfType<UsersLoaderResult>()(
  z.union([
    z.object({
      success: z.literal(true),
      value: zodUserPublic,
    }),
    z.object({
      success: z.literal(false),
      error: z.custom<Error>((value) => value instanceof Error),
    }),
  ]),
).optional();

const usersRoute: RouteObject = {
  path: "/users",
  element: <ErrorScreen />,
  async loader({ request }): Promise<UsersLoaderResult> {
    console.warn("users loader");

    try {
      const url = new URL(request.url);
      const username =
        url.searchParams.get("username") ?? raise("Username not provided");

      const profile = await fetchProfile(username);

      return { success: true, value: profile };
    } catch (caughtError) {
      const error = ensureError(caughtError);
      return { success: false, error };
    }
  },
};

export const RPCRoutes: RouteObject[] = [
  usersRoute,
  {
    path: "/followers",
    element: <ErrorScreen />,
  },
];
