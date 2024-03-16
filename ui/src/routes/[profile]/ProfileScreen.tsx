import { Outlet } from "react-router-dom";
import { useProfileLoader } from "../[profile]";
import { Screen } from "../_app/Screen";
import { NavBar } from "./NavBar";
import { ProfileCard } from "./ProfileCard";
import { PostsProvider } from "./posts/PostsContext";
import { PostsList } from "./posts/PostsList";

function PostsSection() {
  return (
    <section>
      <h2 className="sr-only">Spills 🍵</h2>

      <PostsProvider>
        <PostsList />
      </PostsProvider>
    </section>
  );
}

export function ProfileScreen() {
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
        <PostsSection />
      </main>

      <Outlet />
    </Screen>
  );
}
