import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { BsTrashFill } from "react-icons/bs";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { LoadingCursorAbsoluteOverlay } from "./Loading";
import { useUserContext } from "./UserContext";
import { ModalContent } from "./modal/Modal";
import { useModalContext } from "./modal/ModalContext";
import { useToastContext } from "./toast/ToastContext";

async function deletePost(post: PostWithAuthor) {
  const headerAuth = getFromStorage("SESS");

  const deleteResult = await fetchAPI("/api/v0/posts", "DELETE", {
    headers: { Authorization: headerAuth },
    query: {
      id: post.id,
    },
  });
  if (!deleteResult.success) raise("Failed deleting", deleteResult.error);
}

function DeletePostModalContent(props: { postToDelete: PostWithAuthor }) {
  const { showOnToast } = useToastContext();
  const { closeModal, makeModalCancellable } = useModalContext();
  const { postToDelete } = props;
  const [isDeleting, setIsDeleting] = useState(false);

  async function triggerDelete() {
    if (isDeleting) {
      logger.warn("Cannot delete if already deleting...");
      return;
    }
    setIsDeleting(true);
    makeModalCancellable(false);

    const deleteResult = await safeAsync(() => deletePost(postToDelete));
    if (!deleteResult.success) {
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
export function PostCard(props: { post: PostWithAuthor }) {
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
