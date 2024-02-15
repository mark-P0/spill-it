import { UserPublicWithFollows } from "@spill-it/db/schema/zod";
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
  const [profile, setProfile] = useState<UserPublicWithFollows | null>(null);
  const initializeProfile = useCallback(async () => {
    try {
      logger.debug("Parsing URL params...");
      const paramsParsing = zodProfileParams.safeParse(rawParams);
      const params = paramsParsing.success
        ? paramsParsing.data
        : raise("Unexpected URL params", paramsParsing.error);

      logger.debug("Fetching profile info...");
      const { username } = params;
      const userResult = await fetchAPI("/api/v0/users", "GET", {
        query: { username },
      });
      const users = userResult.success
        ? userResult.value.data
        : raise("Failed fetching profile info");

      logger.debug("Checking profile info...");
      if (users.length > 1) raise("Multiple users for a username...?");
      const user = users[0] ?? raise("Username possibly does not exist");

      logger.debug("Storing user info as profile state...");
      setProfile(user);
    } catch (caughtError) {
      setError(ensureError(caughtError));
    }
  }, [rawParams]);
  useEffect(() => {
    if (profile !== null) return;
    initializeProfile();
  }, [profile, initializeProfile]);

  return { profile, initializeProfile };
});
