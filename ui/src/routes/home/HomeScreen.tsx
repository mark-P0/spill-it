import { safe } from "@spill-it/utils/safe";
import clsx from "clsx";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { LoadingCursorAbsoluteOverlay } from "../_app/Loading";
import { Screen } from "../_app/Screen";
import { useUserContext } from "../_app/UserContext";
import { clsLinkBlock } from "../_app/classes";
import { useToastContext } from "../_app/toast/ToastContext";
import { Feed } from "./feed/Feed";
import { FeedProvider, useFeedContext } from "./feed/FeedContext";

function ProfileButtonLink() {
  const { user } = useUserContext();

  if (user === null) return null;

  const { username, portraitUrl, handleName } = user;
  return (
    <Link
      to={endpointWithParam("/:username", { username })}
      className={clsx(
        "overflow-clip",
        "border-2 border-white/50",
        clsLinkBlock,
        "w-9 aspect-square rounded-full", // Based on styles for icon buttons
        ...["transition", "active:scale-90 hover:brightness-90"],
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
  const { extendFeedWithRecent } = useFeedContext();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setContent("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    logger.debug("Submitting post...");
    event.preventDefault();
    setIsSubmitting(true);

    logger.debug("Retrieving session info...");
    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      logger.error(headerAuthResult.error);
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
      setIsSubmitting(false);
      return;
    }
    const headerAuth = headerAuthResult.value;

    logger.debug("Sending post...");
    const fetchResult = await fetchAPI("/api/v0/posts", "POST", {
      headers: { Authorization: headerAuth },
      body: { content },
    });
    if (!fetchResult.success) {
      logger.error(fetchResult.error);
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
      setIsSubmitting(false);
      return;
    }

    logger.debug("Finishing submission...");
    extendFeedWithRecent();
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
    <FeedProvider>
      <Screen className="grid auto-rows-min gap-6 p-6">
        <header className="flex items-center gap-3">
          <h1 className="text-3xl">Home</h1>

          <div className="ml-auto">
            <ProfileButtonLink />
          </div>
        </header>
        <PostForm />

        <main>
          <h2 className="sr-only">Spills 🍵</h2>

          <Feed />
        </main>
      </Screen>
    </FeedProvider>
  );
}
