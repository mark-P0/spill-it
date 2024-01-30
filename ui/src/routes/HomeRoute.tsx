import { safe } from "@spill-it/utils/safe";
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
        <textarea
          value={content}
          onChange={(event) => setContent(event.currentTarget.value)}
          placeholder="What's the tea sis?!"
          className="w-full bg-black/20 resize-none p-3"
        ></textarea>
      </label>

      <button
        disabled={content === ""}
        className="ml-auto bg-rose-500 disabled:opacity-50 rounded-full px-6 py-3 font-bold tracking-wide"
      >
        Spill! 🍵
      </button>
    </form>
  );
}

export function HomeScreen() {
  return (
    <main className="min-h-screen bg-fuchsia-950 text-white grid auto-rows-min gap-6 p-6">
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
