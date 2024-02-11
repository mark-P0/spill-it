import { raise } from "@spill-it/utils/errors";
import { z } from "zod";
import { EndpointParams, endpoint } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { createLoader } from "../../utils/react";

/**
 * https://github.com/colinhacks/zod/issues/372#issuecomment-826380330
 * - Double function required as TS only allows either inferred or explicit generics, but not a mix
 */
function zodOfType<T>() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Only used for typechecking, and the author has "guaranteed" functionality
  return <S extends z.ZodType<T, any, any>>(schema: S) => schema;
}

export const profilePath = endpoint("/:username");
const zodProfileParams = zodOfType<EndpointParams<"/:username">>()(
  z.object({
    username: z.string(),
  }),
);

export const [loadProfile, useProfileLoader] = createLoader(
  async ({ params: rawParams }) => {
    const paramsParsing = zodProfileParams.safeParse(rawParams);
    const params = paramsParsing.success
      ? paramsParsing.data
      : raise("Unexpected URL values", paramsParsing.error);

    const { username } = params;
    const userResult = await fetchAPI("/api/v0/users", "GET", {
      query: { username },
    });
    const users = userResult.success
      ? userResult.value.data
      : raise("Failed fetching profile info");

    if (users.length > 1) raise("Multiple users for a username...?");
    const user = users[0] ?? raise("Username possibly does not exist");

    return user;
  },
);
