import { safe } from "@spill-it/utils/safe";
import clsx from "clsx";
import { FormEvent, useState } from "react";
import { Route, redirect } from "react-router-dom";
import { endpoint } from "../utils/endpoints";
import { fetchAPI } from "../utils/fetch-api";
import { buildHeaderAuthFromStorage, isLoggedIn } from "../utils/is-logged-in";

function PostForm() {
  const [content, setContent] = useState("");

  function reset() {
    setContent("");
  }

  // TODO Show a popup on error?
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const headerAuthResult = safe(() => buildHeaderAuthFromStorage());
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts", "POST", {
      headers: { Authorization: headerAuth },
      body: { content },
    });
    if (!fetchResult.success) {
      console.error(fetchResult.error);
      return;
    }

    reset();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label>
        <span className="sr-only">Tea 🍵</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.currentTarget.value)}
          placeholder="What's the tea sis?!"
          className={clsx(
            "resize-none placeholder:text-white/50",
            "w-full rounded p-3",
            "bg-white/10",
          )}
        ></textarea>
      </label>

      <button
        disabled={content === ""}
        className={clsx(
          "ml-auto",
          "rounded-full px-6 py-3",
          "bg-rose-500 disabled:opacity-50",
          "font-bold tracking-wide",
        )}
      >
        Spill! 🍵
      </button>
    </form>
  );
}

export function HomeScreen() {
  return (
    <main
      className={clsx(
        "min-h-screen",
        "grid auto-rows-min gap-6 p-6",
        "bg-fuchsia-950 text-white",
      )}
    >
      <h1 className="text-3xl">Home</h1>

      <PostForm />
    </main>
  );
}

export const HomeRoute = () => (
  <Route
    path={endpoint("/home")}
    loader={async () => {
      const canShowHome = await isLoggedIn();
      if (!canShowHome) {
        return redirect(endpoint("/welcome"));
      }

      return null;
    }}
    element={<HomeScreen />}
  />
);
