import { raise } from "@spill-it/utils/errors";
import { zodOfType } from "@spill-it/utils/zod";
import { z } from "zod";
import { EndpointParams } from "../utils/endpoints";
import { fetchAPI } from "../utils/fetch-api";
import { logger } from "../utils/logger";
import { createLoader } from "../utils/react";

const zodProfileParams = zodOfType<EndpointParams<"/:username">>()(
  z.object({
    username: z.string(),
  }),
);

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
async function fetchFollowers(userId: string) {
  const followersResult = await fetchAPI("/api/v0/followers", "GET", {
    query: { userId },
  });
  const followers = followersResult.success
    ? followersResult.value.data
    : raise("Failed fetching followers", followersResult.error);

  return followers;
}
async function fetchFollowings(userId: string) {
  const followingsResult = await fetchAPI("/api/v0/followings", "GET", {
    query: { userId },
  });
  const followings = followingsResult.success
    ? followingsResult.value.data
    : raise("Failed fetching followings", followingsResult.error);

  return followings;
}

export const profileRouteId = "[profile]";
export const [loadProfile, useProfileLoader] = createLoader(
  profileRouteId,
  async ({ params }) => {
    const { username } = zodProfileParams.parse(params);

    logger.debug("Fetching profile...");
    const profile = await fetchProfile(username);

    logger.debug("Fetching profile follows...");
    const [followers, followings] = await Promise.all([
      fetchFollowers(profile.id),
      fetchFollowings(profile.id),
    ]);

    return { profile, followers, followings };
  },
);