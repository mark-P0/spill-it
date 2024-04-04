import { POST_CONTENT_LEN_MAX, zodPostContent } from "@spill-it/constraints";
import { ensureError, raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { useFieldState } from "../../utils/react";
import { getFromStorage } from "../../utils/storage";
import { TextArea } from "../_app/Input";
import { LoadingCursorAbsoluteOverlay } from "../_app/Loading";
import { Screen } from "../_app/Screen";
import { useUserContext } from "../_app/UserContext";
import { clsBtn, clsLinkBlock } from "../_app/classes";
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

async function submitPost(content: string) {
  const headerAuth = getFromStorage("SESS");

  const fetchResult = await fetchAPI("/api/v0/posts", "POST", {
    headers: { Authorization: headerAuth },
    body: { content },
  });
  if (!fetchResult.success) raise("Failed creating post", fetchResult.error);
}
function PostForm() {
  const { user } = useUserContext();
  const { showOnToast } = useToastContext();
  const { extendFeedWithRecent } = useFeedContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contentDefault: string = "";
  const [content, contentValidity, updateContent] = useFieldState(
    contentDefault,
    useCallback((incoming) => {
      const parsing = zodPostContent.safeParse(incoming);
      if (!parsing.success) {
        return parsing.error.issues[0]?.message ?? "Invalid handle name";
      }

      return "";
    }, []),
  );

  function reset() {
    updateContent("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (user?.username === "guest") {
      logger.error("Guests cannot create posts");
      showOnToast(<>Ready to spill? 😋</>, "info");
      return;
    }

    setIsSubmitting(true);
    try {
      logger.debug("Submitting post...");
      await submitPost(content);

      extendFeedWithRecent();
      reset();

      showOnToast(<>Spilt! 😋</>, "info");
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
    }
    setIsSubmitting(false);
  }

  const remainingCharCt = POST_CONTENT_LEN_MAX - content.length;
  const isContentValid = contentValidity === "";

  return (
    <form onSubmit={submit} className="relative">
      <fieldset disabled={isSubmitting} className="grid gap-3">
        <label>
          <span className="sr-only">Tea 🍵</span>
          <TextArea
            value={content}
            onChange={(event) => updateContent(event.currentTarget.value)}
            placeholder="What's the tea sis?!"
            validity={contentValidity}
            // reportValidity
            className={clsx(
              "resize-none placeholder:text-white/50",
              "w-full rounded-lg p-3",
              "bg-white/10 disabled:opacity-50",
            )}
          />
        </label>
        <div className="ml-auto flex flex-row-reverse items-center gap-3">
          <button disabled={!isContentValid} className={clsx(clsBtn)}>
            {isSubmitting ? <>Spilling...</> : <>Spill! 🍵</>}
          </button>

          {remainingCharCt < 16 && (
            <span
              className={clsx(
                //
                "text-lg font-bold tracking-widest",
                "transition",
                remainingCharCt < 0
                  ? "text-rose-500"
                  : remainingCharCt < 8
                    ? "text-yellow-500"
                    : "text-white",
              )}
            >
              {remainingCharCt}
            </span>
          )}
        </div>
      </fieldset>

      {isSubmitting && <LoadingCursorAbsoluteOverlay />}
    </form>
  );
}

export function HomeScreen() {
  document.title = "Home 🍵 Spill.it!";

  const { reflectUser } = useUserContext();

  useEffect(() => {
    reflectUser();

    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run only once, intended for when transitioning from login to home
  }, []);

  return (
    <FeedProvider>
      <Screen className="grid auto-rows-min gap-6 p-6">
        <header className="flex items-center gap-3">
          <h1 className="sr-only">Home</h1>

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
