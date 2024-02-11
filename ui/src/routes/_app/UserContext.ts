import { User } from "@spill-it/db/schema/drizzle";
import { safe } from "@spill-it/utils/safe";
import { useEffect, useState } from "react";
import { fetchAPI } from "../../utils/fetch-api";
import { createNewContext } from "../../utils/react";
import { getFromStorage } from "../../utils/storage";

export const [useUserContext, UserProvider] = createNewContext(() => {
  const [user, setUser] = useState<User | null>(null);
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
        console.error(new Error("Failed fetching user", userResult.error));
        return;
      }
      const user = userResult.value.data;

      setUser(user);
    })();
  }, []);

  return { user };
});
