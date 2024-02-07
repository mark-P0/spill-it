import { PostWithAuthor } from "@spill-it/db/schema";
import { safe } from "@spill-it/utils/safe";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { FormEvent, useEffect, useState } from "react";
import { BsTrashFill } from "react-icons/bs";
import { fetchAPI } from "../../utils/fetch-api";
import { getFromStorage } from "../../utils/storage";
import { Screen } from "../_app/Screen";
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";
import { useToastContext } from "../_app/toast/ToastContext";
import { HomeProvider, useHomeContext } from "./HomeContext";

/**
 * More reliable for showing a cursor over a whole element
 * as interactive elements override it with their respective styles
 */
function LoadingCursorAbsoluteOverlay() {
  return <div className="absolute w-full h-full cursor-wait"></div>;
}

function PostForm() {
  const { setToastAttrs } = useToastContext();
  const { refreshPosts } = useHomeContext();
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
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
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
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
      setIsSubmitting(false);
      return;
    }

    refreshPosts();
    setToastAttrs({
      content: "Spilt! 😋",
      level: "info",
    });
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
            "bg-rose-500 disabled:opacity-50",
            "font-bold tracking-wide",
          )}
        >
          {isSubmitting ? <>Spilling...</> : <>Spill! 🍵</>}
        </button>

        {isSubmitting && <LoadingCursorAbsoluteOverlay />}
      </fieldset>
    </form>
  );
}

function DeletePostModalContent() {
  const { setToastAttrs } = useToastContext();
  const { closeModal, makeModalCancellable } = useModalContext();
  const { postToDelete, setPostToDelete, refreshPosts } = useHomeContext();
  const [isDeleting, setIsDeleting] = useState(false);

  function finalizeDeleting() {
    setIsDeleting(false);
    makeModalCancellable(true);
    setPostToDelete(null);
    closeModal();
  }

  async function deletePost() {
    if (isDeleting) {
      console.warn("Cannot delete if already deleting...");
      return;
    }
    setIsDeleting(true);
    makeModalCancellable(false);

    if (postToDelete === null) {
      console.error("Post to delete does not exist...?");
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
      finalizeDeleting();
      return;
    }

    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
      finalizeDeleting();
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts", "DELETE", {
      headers: { Authorization: headerAuth },
      query: {
        id: postToDelete.id,
      },
    });
    if (!fetchResult.success) {
      console.error(fetchResult.error);
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
      finalizeDeleting();
      return;
    }

    refreshPosts();
    setToastAttrs({
      content: "Spill cleaned up 😔",
      level: "info",
    });
    finalizeDeleting();
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
            onClick={deletePost}
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
              "outline outline-1 outline-white/50",
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
  const { setPostToDelete } = useHomeContext();
  const { post } = props;
  const { content, timestamp, author } = post;

  function promptDelete() {
    setPostToDelete(post);
    showOnModal(<DeletePostModalContent />);
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
          className="rounded-full p-1 transition hover:bg-white/25 active:scale-90"
        >
          <BsTrashFill />
        </button>
      </div>
    </article>
  );
}
function PostsList() {
  const { setToastAttrs } = useToastContext();
  const { posts } = useHomeContext();

  useEffect(() => {
    if (posts !== "error") return;

    // TODO Allow retrying from toast?
    setToastAttrs({
      content: "🥶 We spilt things along the way",
      level: "warn",
    });
  }, [posts, setToastAttrs]);
  if (posts === "error") return null; // The "output" is the toast above

  if (posts === "fetching") return "fetching"; // TODO Use loading component?
  return (
    <ol className="grid gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ol>
  );
}

export function HomeScreen() {
  return (
    <HomeProvider>
      <Screen className="grid auto-rows-min gap-6 p-6">
        <h1 className="text-3xl">Home</h1>
        <PostForm />

        <main>
          <h2 className="sr-only">Spills 🍵</h2>

          <PostsList />
        </main>
      </Screen>
    </HomeProvider>
  );
}
