import { raise } from "@spill-it/utils/errors";
import { zodOfType } from "@spill-it/utils/zod";
import { z } from "zod";
import { EndpointParams, endpoint } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { createLoader } from "../../utils/react";

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

    return { profile: user };
  },
);
