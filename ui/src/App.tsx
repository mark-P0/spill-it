import { buildHeaderAuth } from "@spill-it/header-auth";
import { useEffect, useState } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { fetchAPI } from "./utils/fetch-api";

async function isSessionValid(): Promise<boolean> {
  const id = localStorage.getItem("SPILLITSESS");
  if (id === null) return false;

  const res = await fetchAPI("/api/v0/users/me", {
    headers: {
      Authorization: buildHeaderAuth("SPILLITSESS", { id }),
    },
  });
  if (!res.success) return false;

  return true;
}

export function App() {
  const [screen, setScreen] = useState<null | "welcome" | "home">(null);
  useEffect(() => {
    (async () => {
      if (await isSessionValid()) {
        setScreen("home");
      } else {
        setScreen("welcome");
      }
    })();
  }, []);

  if (screen === "welcome") {
    return <WelcomeScreen />;
  }
  if (screen === "home") {
    return (
      <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
        Home page
      </main>
    );
  }
  return null;
}
