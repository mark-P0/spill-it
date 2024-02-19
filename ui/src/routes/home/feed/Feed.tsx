import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { ensureError } from "@spill-it/utils/errors";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { BsTrashFill } from "react-icons/bs";
import { logger } from "../../../utils/logger";
import { Controller, useObserver } from "../../../utils/react";
import {
  LoadingCursorAbsoluteOverlay,
  LoadingIndicator,
} from "../../_app/Loading";
import { useUserContext } from "../../_app/UserContext";
import { ModalContent } from "../../_app/modal/Modal";
import { useModalContext } from "../../_app/modal/ModalContext";
import { useToastContext } from "../../_app/toast/ToastContext";
import { useFeedContext } from "./FeedContext";

function FeedEndObserver() {
  const [divRef, isIntersecting] = useObserver<HTMLDivElement>();

  const { extendFeed } = useFeedContext();
  useEffect(() => {
    if (!isIntersecting) return;
    const ctl: Controller = { shouldProceed: true };
    extendFeed(ctl);
    return () => {
      ctl.shouldProceed = false;
    };
  }, [isIntersecting, extendFeed]);

  return <div ref={divRef}>{isIntersecting && <LoadingIndicator />}</div>;
}

function DeletePostModalContent(props: { postToDelete: PostWithAuthor }) {
  const { showOnToast } = useToastContext();
  const { closeModal, makeModalCancellable } = useModalContext();
  const { deletePost } = useFeedContext();
  const { postToDelete } = props;
  const [isDeleting, setIsDeleting] = useState(false);

  async function triggerDelete() {
    logger.debug("Triggering delete...");
    if (isDeleting) {
      logger.warn("Cannot delete if already deleting; ignoring...");
      return;
    }

    setIsDeleting(true);
    makeModalCancellable(false);
    try {
      logger.debug("Deleting...");
      await deletePost(postToDelete);

      showOnToast(<>Spill cleaned... 🧹</>, "critical");
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
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
              "select-none",
              "rounded-full px-6 py-3",
              "disabled:opacity-50",
              "font-bold tracking-wide",
              ...[
                "transition",
                "bg-rose-500 enabled:hover:bg-red-700",
                "enabled:active:scale-95",
              ],
            )}
          >
            Delete 🗑
          </button>
          <button
            type="button"
            onClick={closeModal}
            className={clsx(
              "select-none",
              "rounded-full px-6 py-3",
              "disabled:opacity-50",
              "border border-white/25",
              ...[
                "transition",
                "enabled:hover:bg-white/10",
                "enabled:active:scale-95",
              ],
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
  const { user } = useUserContext();
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
          <p className="text-white/50 text-xs uppercase tracking-wide">
            {formatPostDate(timestamp)}
          </p>
        </header>
        <p>{content}</p>
      </div>
      <div>
        {user?.id === author?.id && (
          <button
            onClick={promptDelete}
            className={clsx(
              "rounded-full p-2",
              ...["transition", "hover:bg-white/25 active:scale-90"],
            )}
          >
            <BsTrashFill />
          </button>
        )}
      </div>
    </article>
  );
}

export function Feed() {
  const { showOnToast } = useToastContext();
  const { feedStatus, feed, hasNextPosts, initializeFeed } = useFeedContext();

  useEffect(() => {
    if (feedStatus !== "error") return;
    showOnToast(<>🥶 We spilt things along the way</>, "warn");
  }, [feedStatus, showOnToast]);
  if (feedStatus === "error") {
    return (
      <div className="grid place-items-center">
        <button
          onClick={initializeFeed}
          className={clsx(
            "select-none",
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
          Load Posts 🔁
        </button>
      </div>
    );
  }

  if (feedStatus === "fetching") {
    return (
      <div className="grid place-items-center">
        <LoadingIndicator />
      </div>
    );
  }
  return (
    <ol className="grid gap-3">
      {feed.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
      <li className="grid place-items-center mt-6 mb-3">
        {hasNextPosts ? (
          <FeedEndObserver />
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
