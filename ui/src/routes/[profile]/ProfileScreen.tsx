import { zodOfType } from "@spill-it/utils/zod";
import { useEffect } from "react";
import {
  Link,
  Outlet,
  useFetcher,
  useParams,
  useRevalidator,
} from "react-router-dom";
import { z } from "zod";
import { EndpointParams } from "../../utils/endpoints";
import { useProfileLoader } from "../[profile]";
import { Screen } from "../_app/Screen";
import { zodUsersLoader } from "../_rpc";
import { NavBar } from "./NavBar";
import { ProfileCard } from "./ProfileCard";
import { PostsProvider } from "./posts/PostsContext";
import { PostsList } from "./posts/PostsList";

function _ProfileScreen() {
  const { profile } = useProfileLoader();

  const { handleName, username } = profile;
  document.title = `${handleName} (${username}) 👀 Spill.it!`;

  return (
    <Screen className="grid auto-rows-min gap-6 p-6">
      <header className="grid grid-rows-subgrid row-span-2">
        <NavBar />
        <ProfileCard />
      </header>

      <main>
        <h2 className="sr-only">Spills 🍵</h2>

        <PostsList />
      </main>

      <Outlet />
    </Screen>
  );
}
export function ProfileScreen1() {
  return (
    <PostsProvider>
      <_ProfileScreen />
    </PostsProvider>
  );
}

const zodProfileParams = zodOfType<EndpointParams<"/:username">>()(
  z.object({
    username: z.string(),
  }),
);

export function ProfileScreen() {
  const rawParams = useParams();
  const params = zodProfileParams.parse(rawParams);

  const fetcher = useFetcher();
  function loadProfile() {
    const url = new URL("/users", window.location.href);
    url.searchParams.set("username", params.username);
    const effectiveUrl = url.href.replace(url.origin, "");
    fetcher.load(effectiveUrl);
  }
  useEffect(() => {
    // const isAtStart = fetcher.state === "idle" && fetcher.data === undefined;
    // if (!isAtStart) return;

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run this effect when URL params change
  }, [params.username]);

  const userResult = zodUsersLoader.parse(fetcher.data);
  const isLoading = userResult === undefined;
  if (userResult?.success === false) {
    throw userResult.error;
  }

  console.warn("profile screen");
  console.warn(userResult);

  return (
    <button
      onClick={() => {
        loadProfile();
      }}
    >
      revalidate
    </button>
  );

  return <Link to="/markjohn">Link</Link>;
}
