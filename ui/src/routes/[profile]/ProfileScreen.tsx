import { Outlet } from "react-router-dom";
import { useProfileLoader } from "../[profile]";
import { Screen } from "../_app/Screen";
import { useUserContext } from "../_app/UserContext";
import { NavBar } from "./NavBar";
import { ProfileCard } from "./ProfileCard";
import { PostsProvider } from "./posts/PostsContext";
import { PostsList } from "./posts/PostsList";

function PostsSection() {
  const { user } = useUserContext();
  const { profile, follow } = useProfileLoader();

  const isFollowRequested = follow !== null ? !follow.isAccepted : false;
  if (isFollowRequested) {
    return (
      <section className="w-fit mx-auto">
        <h2 className="text-xl text-white/75">
          ⚖ <span className="font-bold">{profile.handleName}</span> is judging
          you
        </h2>

        <p className="text-white/50">
          Your worth as a friend is being evaluated.
          <br />
          You may <span className="font-bold">cancel your request</span> at any
          time.
        </p>
      </section>
    );
  }

  const isOwnProfile = profile.id === user?.id;
  const isProfilePublic = !profile.isPrivate;
  const isFollowing = follow?.isAccepted ?? false;
  const canShowPosts = isOwnProfile || isProfilePublic || isFollowing;

  if (!canShowPosts) {
    return (
      <section className="w-fit mx-auto">
        <h2 className="text-xl text-white/75">
          ❌ <span className="font-bold">{profile.handleName}</span> chooses
          their friends
        </h2>

        <p className="text-white/50">
          Only a privileged few can see their mess.
          <br />
          Ask for permission by sending a{" "}
          <span className="font-bold">follow request</span>.
        </p>
      </section>
    );
  }

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
