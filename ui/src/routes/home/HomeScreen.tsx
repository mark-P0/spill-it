import { PostWithAuthor } from "@spill-it/db/schema";
import { safe, safeAsync } from "@spill-it/utils/safe";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BsBoxArrowLeft, BsTrashFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpoint } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { getFromStorage } from "../../utils/storage";
import { Screen } from "../_app/Screen";
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";
import { useToastContext } from "../_app/toast/ToastContext";
import { HomeProvider, useHomeContext } from "./HomeContext";
import { Controller } from "./controller";

/**
 * More reliable for showing a cursor over a whole element
 * as interactive elements override it with their respective styles
 */
function LoadingCursorAbsoluteOverlay() {
  return <div className="absolute w-full h-full cursor-wait"></div>;
}

function LoadingIndicator() {
  return (
    <figure className="grid">
      <figcaption className="sr-only">Loading...</figcaption>

      <div className="row-[1] col-[1] animate-[ping_1.5s_ease-out_infinite]">
        <div className="w-9 aspect-square rounded-full animate-palette"></div>
      </div>
      <div className="row-[1] col-[1]">
        <div className="w-9 aspect-square rounded-full animate-palette"></div>
      </div>
    </figure>
  );
}

function PostForm() {
  const { showOnToast } = useToastContext();
  const { extendPostsWithRecent } = useHomeContext();
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
      showOnToast("😫 We spilt too much! Please try again.", "warn");
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
      showOnToast("😫 We spilt too much! Please try again.", "warn");
      setIsSubmitting(false);
      return;
    }

    extendPostsWithRecent();
    showOnToast("Spilt! 😋", "info");
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
            "rounded-full px-6 py-3",
            "disabled:opacity-50",
            "font-bold tracking-wide",
            ...[
              "transition",
              "bg-rose-500 enabled:hover:bg-rose-600",
              "active:scale-95",
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

function DeletePostModalContent(props: { postToDelete: PostWithAuthor }) {
  const { showOnToast } = useToastContext();
  const { closeModal, makeModalCancellable } = useModalContext();
  const { deletePost } = useHomeContext();
  const { postToDelete } = props;
  const [isDeleting, setIsDeleting] = useState(false);

  async function triggerDelete() {
    if (isDeleting) {
      console.warn("Cannot delete if already deleting...");
      return;
    }
    setIsDeleting(true);
    makeModalCancellable(false);

    const deleteResult = await safeAsync(() => deletePost(postToDelete));
    if (!deleteResult.success) {
      showOnToast("😫 We spilt too much! Please try again.", "warn");
    }

    setIsDeleting(false);
    makeModalCancellable(true);
    closeModal();
  }

  return (
    <ModalContent>
      <h4 className="text-xl font-bold tracking-wide">
        Are you sure you want to delete this post?
      </h4>
      <p>This cannot be undone!</p>

      <form>
        <fieldset disabled={isDeleting} className="relative grid gap-3 mt-6">
          <button
            type="button"
            onClick={triggerDelete}
            className={clsx(
              "rounded-full px-6 py-3",
              "disabled:opacity-50",
              "font-bold tracking-wide",
              ...[
                "transition",
                "bg-rose-500 hover:bg-red-700",
                "active:scale-95",
              ],
            )}
          >
            Delete 🗑
          </button>
          <button
            type="button"
            onClick={closeModal}
            className={clsx(
              "rounded-full px-6 py-3",
              "disabled:opacity-50",
              "outline outline-1 outline-white/25",
              ...["transition", "hover:bg-white/10", "active:scale-95"],
            )}
          >
            Cancel 🙅‍♀️
          </button>

          {isDeleting && <LoadingCursorAbsoluteOverlay />}
        </fieldset>
      </form>
    </ModalContent>
  );
}

function formatPostDate(date: PostWithAuthor["timestamp"]): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    includeSeconds: true,
  });
}
function PostCard(props: { post: PostWithAuthor }) {
  const { showOnModal } = useModalContext();
  const { post } = props;
  const { content, timestamp, author } = post;

  function promptDelete() {
    showOnModal(<DeletePostModalContent postToDelete={post} />);
  }

  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-6 bg-white/10 p-6">
      <div>
        <img
          src={author.portraitUrl}
          alt={`Portrait of "${author.handleName}"`}
          className="w-9 aspect-square rounded-full"
        />
      </div>
      <div>
        <header className="flex items-baseline gap-3">
          {/* TODO Link to profile? */}
          <h3 className="font-bold">{author.username}</h3>
          <p className="text-xs uppercase tracking-wide opacity-50">
            {formatPostDate(timestamp)}
          </p>
        </header>
        <p>{content}</p>
      </div>
      <div>
        <button
          onClick={promptDelete}
          className="rounded-full p-2 transition hover:bg-white/25 active:scale-90"
        >
          <BsTrashFill />
        </button>
      </div>
    </article>
  );
}

function useObserver<T extends Element>() {
  const [isIntersecting, setIsIntersecting] = useState(false);

  const elementRef = useRef<T | null>(null);
  useEffect(() => {
    const element = elementRef.current;
    if (element === null) {
      console.warn("Element to be observed does not exist...?");
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.length > 1) {
        console.warn("Multiple elements observed...?");
        return;
      }

      const entry = entries[0];
      if (entry === undefined) {
        console.warn("Observed element does not exist...?");
        return;
      }

      // TODO Also have state for entry?
      setIsIntersecting(entry.isIntersecting);
    });

    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  }, []);

  return [elementRef, isIntersecting] as const;
}
function PostsListEndObserver() {
  const [divRef, isIntersecting] = useObserver<HTMLDivElement>();

  const { extendPosts } = useHomeContext();
  useEffect(() => {
    if (!isIntersecting) return;
    const ctl: Controller = { shouldProceed: true };
    extendPosts(ctl);
    return () => {
      ctl.shouldProceed = false;
    };
  }, [isIntersecting, extendPosts]);

  return <div ref={divRef}>{isIntersecting && <LoadingIndicator />}</div>;
}

function PostsList() {
  const { showOnToast } = useToastContext();
  const { postsStatus, posts, refreshPosts, hasNextPosts } = useHomeContext();

  useEffect(() => {
    if (postsStatus !== "error") return;
    showOnToast("🥶 We spilt things along the way", "warn");
  }, [postsStatus, showOnToast]);
  if (postsStatus === "error") {
    return (
      <div className="grid place-items-center">
        <button
          onClick={refreshPosts}
          className={clsx(
            "rounded-full px-6 py-3",
            "disabled:opacity-50",
            "font-bold tracking-wide",
            ...[
              "transition",
              "bg-fuchsia-500 enabled:hover:bg-fuchsia-600",
              "active:scale-95",
            ],
          )}
        >
          Load Posts 🔁
        </button>
      </div>
    );
  }

  if (postsStatus === "fetching") {
    return (
      <div className="grid place-items-center">
        <LoadingIndicator />
      </div>
    );
  }
  return (
    <ol className="grid gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
      <li className="grid place-items-center mt-6 mb-3">
        {hasNextPosts ? (
          <PostsListEndObserver />
        ) : (
          <p>
            <span className="italic tracking-wide text-white/50">
              More tea later, maybe
            </span>{" "}
            😋
          </p>
        )}
      </li>
    </ol>
  );
}

function LogoutModalContent() {
  const { closeModal } = useModalContext();

  return (
    <ModalContent>
      <h2 className="text-xl font-bold tracking-wide">
        Do you really want to log out?
      </h2>

      <form className="grid gap-3 mt-6">
        <Link
          to={endpoint("/logout")}
          className={clsx(
            "text-center",
            "rounded-full px-6 py-3",
            "disabled:opacity-50",
            "font-bold tracking-wide",
            ...[
              "transition",
              "bg-fuchsia-500 hover:bg-fuchsia-600",
              "active:scale-95",
            ],
          )}
        >
          Yes 👋
        </Link>
        <button
          type="button"
          onClick={closeModal}
          className={clsx(
            "rounded-full px-6 py-3",
            "disabled:opacity-50",
            "outline outline-1 outline-white/25",
            ...["transition", "hover:bg-white/10", "active:scale-95"],
          )}
        >
          No 🙅‍♀️
        </button>
      </form>
    </ModalContent>
  );
}

function LogoutButton() {
  const { showOnModal } = useModalContext();

  function promptLogout() {
    showOnModal(<LogoutModalContent />);
  }

  return (
    <button
      onClick={promptLogout}
      className="rounded-full p-2 transition hover:bg-white/25 active:scale-90"
    >
      <BsBoxArrowLeft />
    </button>
  );
}

export function HomeScreen() {
  return (
    <HomeProvider>
      <Screen className="grid auto-rows-min gap-6 p-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl">Home</h1>
          <LogoutButton />
        </header>
        <PostForm />

        <main>
          <h2 className="sr-only">Spills 🍵</h2>

          <PostsList />
        </main>
      </Screen>
    </HomeProvider>
  );
}
