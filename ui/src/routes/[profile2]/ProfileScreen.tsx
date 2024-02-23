import { Screen } from "../_app/Screen";
import { useProfileLoader } from "./profile-loader";

export function ProfileScreen() {
  const { profile } = useProfileLoader();

  const { handleName, username } = profile;
  document.title = `${handleName} (${username}) 👀 Spill.it!`;

  return (
    <Screen>
      <pre>{JSON.stringify(profile, undefined, 2)}</pre>
    </Screen>
  );
}
