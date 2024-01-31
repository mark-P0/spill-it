import { safe } from "@spill-it/utils/safe";
import { FormEvent, useState } from "react";
import { Route, redirect } from "react-router-dom";
import { ToastProviderWithComponent } from "../components/Toast";
import { useToastContext } from "../contexts/toast";
import { endpoint } from "../utils/endpoints";
import { fetchAPI } from "../utils/fetch-api";
import { buildHeaderAuthFromStorage, isLoggedIn } from "../utils/is-logged-in";

function PostForm() {
  const { setToastAttrs } = useToastContext();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setContent("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const headerAuthResult = safe(() => buildHeaderAuthFromStorage());
    if (!headerAuthResult.success) {
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
      console.error(headerAuthResult.error);
      setIsSubmitting(false);
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts", "POST", {
      headers: { Authorization: headerAuth },
      body: { content },
    });
    if (!fetchResult.success) {
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
      console.error(fetchResult.error);
      setIsSubmitting(false);
      return;
    }

    setToastAttrs({
      content: "Spilt! 😋",
      level: "info",
    });
    setIsSubmitting(false);
    reset();
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={isSubmitting} className="grid gap-3">
        <label>
          <span className="sr-only">Tea 🍵</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.currentTarget.value)}
            placeholder="What's the tea sis?!"
            className="w-full rounded bg-white/10 resize-none p-3"
          ></textarea>
        </label>
        <button
          disabled={content === ""}
          className="ml-auto bg-rose-500 disabled:opacity-50 rounded-full px-6 py-3 font-bold tracking-wide"
        >
          {isSubmitting ? "Spilling..." : "Spill! 🍵"}
        </button>
      </fieldset>
    </form>
  );
}

export function HomeScreen() {
  return (
    <ToastProviderWithComponent>
      <div className="min-h-screen bg-fuchsia-950 text-white grid auto-rows-min gap-6 p-6">
        <h1 className="text-3xl">Home</h1>
        <PostForm />
      </div>
    </ToastProviderWithComponent>
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
