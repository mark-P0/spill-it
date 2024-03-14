import { zodUserPublic } from "@spill-it/db/schema/zod";
import { ensureError, raise } from "@spill-it/utils/errors";
import { Result } from "@spill-it/utils/safe";
import { zodOfType } from "@spill-it/utils/zod";
import { RouteObject } from "react-router-dom";
import { z } from "zod";
import { endpoint } from "../utils/endpoints";
import { fetchAPI } from "../utils/fetch-api";
import { ErrorScreen } from "./_app/ErrorScreen";

async function fetchUser(username: string) {
  const userResult = await fetchAPI("/api/v0/users", "GET", {
    query: { username },
  });
  const users = userResult.success
    ? userResult.value.data
    : raise("Failed fetching user info");

  if (users.length > 1) raise("Multiple users for a username...?");
  const user = users[0] ?? raise("Username possibly does not exist");

  return user;
}

type RPCUsersResult = Result<z.infer<typeof zodUserPublic>>;
export const zodRPCUsers = zodOfType<RPCUsersResult>()(
  z.union([
    z.object({
      success: z.literal(true),
      value: zodUserPublic,
    }),
    z.object({
      success: z.literal(false),
      error: z.custom<Error>((value) => value instanceof Error), // TODO Move to Zod utils?
    }),
  ]),
).optional();

const rpcUsers: RouteObject = {
  path: endpoint("/users"),
  element: <ErrorScreen />,
  async loader({ request }): Promise<RPCUsersResult> {
    try {
      const url = new URL(request.url);
      const username =
        url.searchParams.get("username") ?? raise("Username not provided");

      const profile = await fetchUser(username);

      return { success: true, value: profile };
    } catch (caughtError) {
      const error = ensureError(caughtError);
      return { success: false, error };
    }
  },
};

export const RPCRoutes: RouteObject[] = [rpcUsers];
