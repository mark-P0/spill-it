import { raise } from "@spill-it/utils/errors";
import { zodOfType } from "@spill-it/utils/zod";
import { z } from "zod";
import { EndpointParams } from "../utils/endpoints";
import { fetchAPI } from "../utils/fetch-api";
import { logger } from "../utils/logger";
import { createLoader } from "../utils/react";
import { getFromStorage } from "../utils/storage";

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
async function fetchRawFollowers(userId: string) {
  const headers: { Authorization?: string } = {};
  try {
    headers.Authorization = getFromStorage("SESS");
  } catch {
    logger.warn("Fetching followers without authentication");
  }

  const followersResult = await fetchAPI("/api/v0/followers", "GET", {
    headers,
    query: { userId },
  });
  const followers = followersResult.success ? followersResult.value.data : null;

  return followers;
}
async function fetchRawFollowings(userId: string) {
  const headers: { Authorization?: string } = {};
  try {
    headers.Authorization = getFromStorage("SESS");
  } catch {
    logger.warn("Fetching followings without authentication");
  }

  const followingsResult = await fetchAPI("/api/v0/followings", "GET", {
    headers,
    query: { userId },
  });
  const followings = followingsResult.success
    ? followingsResult.value.data
    : null;

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
    const [rawFollowers, rawFollowings] = await Promise.all([
      fetchRawFollowers(profile.id),
      fetchRawFollowings(profile.id),
    ]);

    const followers = rawFollowers;
    const followings = rawFollowings;

    return { profile, followers, followings };
  },
);
