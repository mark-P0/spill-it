import { safe } from "@spill-it/utils/safe";
import clsx from "clsx";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { getFromStorage } from "../../utils/storage";
import { LoadingCursorAbsoluteOverlay } from "../_app/Loading";
import { Screen } from "../_app/Screen";
import { useUserContext } from "../_app/UserContext";
import { useToastContext } from "../_app/toast/ToastContext";
import { PostsProvider, usePostsContext } from "./posts/PostsContext";
import { PostsList } from "./posts/PostsList";

function ProfileButtonLink() {
  const { user } = useUserContext();

  if (user === null) return null;

  const { username, portraitUrl, handleName } = user;
  return (
    <Link
      to={endpointWithParam("/:username", { username })}
      className={clsx(
        "overflow-clip",
        "w-9 aspect-square rounded-full",
        "border-2 border-white/50",
        ...["transition", "hover:brightness-90 active:scale-95"],
      )}
    >
      <img
        src={portraitUrl}
        alt={`Portrait of "${handleName}"`}
        className="w-full h-full"
      />
    </Link>
  );
}

function PostForm() {
  const { showOnToast } = useToastContext();
  const { extendPostsWithRecent } = usePostsContext();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setContent("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
      setIsSubmitting(false);
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts", "POST", {
      headers: { Authorization: headerAuth },
      body: { content },
    });
    if (!fetchResult.success) {
      console.error(fetchResult.error);
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
      setIsSubmitting(false);
      return;
    }

    extendPostsWithRecent();
    showOnToast(<>Spilt! 😋</>, "info");
    setIsSubmitting(false);
    reset();
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={isSubmitting} className="relative grid gap-3">
        <label>
          <span className="sr-only">Tea 🍵</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.currentTarget.value)}
            placeholder="What's the tea sis?!"
            className={clsx(
              "resize-none placeholder:text-white/50",
              "w-full rounded p-3",
              "bg-white/10 disabled:opacity-50",
            )}
          ></textarea>
        </label>
        <button
          disabled={content === ""}
          className={clsx(
            "ml-auto",
            "select-none",
            "rounded-full px-6 py-3",
            "disabled:opacity-50",
            "font-bold tracking-wide",
            ...[
              "transition",
              "bg-rose-500 enabled:hover:bg-rose-600",
              "enabled:active:scale-95",
            ],
          )}
        >
          {isSubmitting ? <>Spilling...</> : <>Spill! 🍵</>}
        </button>

        {isSubmitting && <LoadingCursorAbsoluteOverlay />}
      </fieldset>
    </form>
  );
}

export function HomeScreen() {
  document.title = "Home 🍵 Spill.it!";

  return (
    <PostsProvider>
      <Screen className="grid auto-rows-min gap-6 p-6">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-3xl">Home</h1>

          <ProfileButtonLink />
        </header>
        <PostForm />

        <main>
          <h2 className="sr-only">Spills 🍵</h2>

          <PostsList />
        </main>
      </Screen>
    </PostsProvider>
  );
}
