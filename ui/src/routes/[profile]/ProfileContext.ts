import { UserPublic } from "@spill-it/db/schema/drizzle";
import { Follower, Following } from "@spill-it/db/schema/zod";
import { ensureError, raise } from "@spill-it/utils/errors";
import { zodOfType } from "@spill-it/utils/zod";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { EndpointParams } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { createNewContext } from "../../utils/react";

const zodProfileParams = zodOfType<EndpointParams<"/:username">>()(
  z.object({
    username: z.string(),
  }),
);
export const [useProfileContext, ProfileProvider] = createNewContext(() => {
  const [error, setError] = useState<Error | null>(null);
  if (error !== null) {
    throw error;
  }

  const rawParams = useParams();
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const reflectProfile = useCallback(async () => {
    try {
      const paramsParsing = zodProfileParams.safeParse(rawParams);
      const params = paramsParsing.success
        ? paramsParsing.data
        : raise("Unexpected URL params", paramsParsing.error);

      const { username } = params;
      const userResult = await fetchAPI("/api/v0/users", "GET", {
        query: { username },
      });
      const users = userResult.success
        ? userResult.value.data
        : raise("Failed fetching profile info");

      if (users.length > 1) raise("Multiple users for a username...?");
      const user = users[0] ?? raise("Username possibly does not exist");

      setProfile(user);
    } catch (caughtError) {
      setError(ensureError(caughtError));
    }
  }, [rawParams]);
  useEffect(() => {
    if (profile !== null) return;

    logger.debug("Reflecting profile on state...");
    reflectProfile();
  }, [profile, reflectProfile]);

  const [followers, setFollowers] = useState<Follower[] | null>(null);
  const reflectFollowers = useCallback(async () => {
    if (profile === null) return;

    try {
      const followersResult = await fetchAPI("/api/v0/followers", "GET", {
        query: { userId: profile.id },
      });
      const followers = followersResult.success
        ? followersResult.value.data
        : raise("Failed fetching followers", followersResult.error);
      setFollowers(followers);
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
    }
  }, [profile]);
  useEffect(() => {
    reflectFollowers();
  }, [reflectFollowers]);

  const [followings, setFollowings] = useState<Following[] | null>(null);
  const reflectFollowings = useCallback(async () => {
    if (profile === null) return;

    try {
      const followingsResult = await fetchAPI("/api/v0/followings", "GET", {
        query: { userId: profile.id },
      });
      const followings = followingsResult.success
        ? followingsResult.value.data
        : raise("Failed fetching followings", followingsResult.error);
      setFollowings(followings);
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
    }
  }, [profile]);
  useEffect(() => {
    reflectFollowings();
  }, [reflectFollowings]);

  return {
    ...{ profile, reflectProfile },
    ...{ followers, reflectFollowers },
    ...{ followings, reflectFollowings },
  };
});
