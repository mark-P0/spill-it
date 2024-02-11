import { Screen } from "../_app/Screen";
import { useProfileLoader } from "./load-profile";

export function ProfileScreen() {
  const profile = useProfileLoader();
  console.warn({ profile });

  return (
    <Screen>
      <pre>{JSON.stringify(profile, undefined, 2)}</pre>
    </Screen>
  );
}
