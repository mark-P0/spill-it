import { Screen } from "../_app/Screen";
import { NavBar, ProfileCard } from "./ProfileComponents";
import { useProfileLoader } from "./profile-loader";

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
        <pre className="bg-red-500 whitespace-normal break-all">
          {JSON.stringify(profile, undefined, 2)}
        </pre>
      </main>
    </Screen>
  );
}
