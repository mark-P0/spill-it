import { UserPublic } from "@spill-it/db/schema/drizzle";
import { safe } from "@spill-it/utils/safe";
import { useEffect, useState } from "react";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { createNewContext } from "../../utils/react";
import { getFromStorage } from "../../utils/storage";

export const [useUserContext, UserProvider] = createNewContext(() => {
  const [user, setUser] = useState<UserPublic | null>(null);
  useEffect(() => {
    (async () => {
      const headerAuthResult = safe(() => getFromStorage("SESS"));
      if (!headerAuthResult.success) return; // User likely not logged in
      const headerAuth = headerAuthResult.value;

      const userResult = await fetchAPI("/api/v0/users/me", "GET", {
        headers: {
          Authorization: headerAuth,
        },
      });
      if (!userResult.success) {
        logger.error(userResult.error);
        return;
      }
      const user = userResult.value.data;

      setUser(user);
    })();
  }, []);

  return { user };
});
