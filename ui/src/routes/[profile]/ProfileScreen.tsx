import { UserPublic } from "@spill-it/db/schema/drizzle";
import { zodOfType } from "@spill-it/utils/zod";
import { useEffect } from "react";
import { Outlet, useFetcher, useParams } from "react-router-dom";
import { z } from "zod";
import { EndpointParams, endpoint } from "../../utils/endpoints";
import { useProfileLoader } from "../[profile]";
import { Screen } from "../_app/Screen";
import { zodRPCUsers } from "../_rpc";
import { NavBar } from "./NavBar";
import { ProfileCard } from "./ProfileCard";
import { PostsProvider } from "./posts/PostsContext";
import { PostsList } from "./posts/PostsList";

function _ProfileScreen1() {
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
      <_ProfileScreen1 />
    </PostsProvider>
  );
}

const zodProfileParams = zodOfType<EndpointParams<"/:username">>()(
  z.object({
    username: z.string(),
  }),
);

function _ProfileScreen(props: { profile: UserPublic }) {
  const { profile } = props;

  return <Screen>{JSON.stringify(profile)}</Screen>;
}
export function ProfileScreen() {
  const rawParams = useParams();
  const params = zodProfileParams.parse(rawParams);

  const fetcher = useFetcher();
  function loadProfile() {
    const url = new URL(endpoint("/users"), window.location.href);
    url.searchParams.set("username", params.username);

    const effectiveUrl = url.href.replace(url.origin, "");
    fetcher.load(effectiveUrl);
  }
  useEffect(() => {
    loadProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run this effect when URL params change
  }, [params.username]);

  const userResult = zodRPCUsers.parse(fetcher.data);

  if (userResult === undefined || fetcher.state !== "idle") {
    return null; // Show nothing; allow the body animations to be seen
  }
  if (!userResult.success) {
    throw userResult.error;
  }
  return <_ProfileScreen profile={userResult.value} />;
}
