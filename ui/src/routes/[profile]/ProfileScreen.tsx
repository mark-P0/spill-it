import { Screen } from "../_app/Screen";
import { useProfileLoader } from "./load-profile";

export function ProfileScreen() {
  const profile = useProfileLoader();
  const { handleName, username, portraitUrl } = profile;

  document.title = `${handleName} (${username}) 👀 Spill.it!`;

  return (
    <Screen className="grid auto-rows-min gap-6 p-6">
      <header className="grid grid-rows-subgrid row-span-2">
        <nav className="flex justify-between">
          <pre>logout</pre>
          <pre>home</pre>
        </nav>

        <section className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">{handleName}</h1>
            <p className="text-lg text-white/50">{username}</p>
          </div>
          <div>
            <img
              src={portraitUrl}
              alt={`Portrait of "${handleName}"`}
              className="w-20 aspect-square rounded-full"
            />
          </div>
        </section>
      </header>

      <main>
        <pre>posts</pre>
      </main>
    </Screen>
  );
}
