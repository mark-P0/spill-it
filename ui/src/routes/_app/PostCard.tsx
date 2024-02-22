import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { ensureError, raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { BsTrashFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { LoadingCursorAbsoluteOverlay } from "./Loading";
import { useUserContext } from "./UserContext";
import {
  clsBtnNegative,
  clsBtnOutline,
  clsLink,
  clsSmallBtnIcon,
} from "./classes";
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

function DeletePostModalContent(props: {
  postToDelete: PostWithAuthor;
  onDeleteEnd?: () => void;
}) {
  const { showOnToast } = useToastContext();
  const { closeModal, makeModalCancellable } = useModalContext();
  const { postToDelete, onDeleteEnd } = props;
  const [isDeleting, setIsDeleting] = useState(false);

  async function triggerDelete() {
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

    onDeleteEnd?.();
    closeModal();
  }

  return (
    <ModalContent>
      <h4 className="text-xl font-bold tracking-wide">
        Are you sure you want to delete this post?
      </h4>
      <p>This cannot be undone!</p>

      <form className="relative">
        <fieldset disabled={isDeleting} className="grid gap-3 mt-6">
          <button
            type="button"
            onClick={triggerDelete}
            className={clsx(clsBtnNegative)}
          >
            Delete 🗑
          </button>
          <button
            type="button"
            onClick={closeModal}
            className={clsx(clsBtnOutline)}
          >
            On second thought...
          </button>
        </fieldset>

        {isDeleting && <LoadingCursorAbsoluteOverlay />}
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
export function PostCard(props: {
  post: PostWithAuthor;
  onDeleteEnd?: () => void;
}) {
  const { user } = useUserContext();
  const { showOnModal } = useModalContext();
  const { post, onDeleteEnd } = props;
  const { content, timestamp, author } = post;
  const { username, handleName, portraitUrl } = author;

  const canDelete = user?.id === author?.id;

  function promptDelete() {
    showOnModal(
      <DeletePostModalContent postToDelete={post} onDeleteEnd={onDeleteEnd} />,
    );
  }

  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-6 rounded p-6 bg-white/10">
      <div>
        <img
          src={portraitUrl}
          alt={`Portrait of "${handleName}"`}
          className="w-9 aspect-square rounded-full"
        />
      </div>

      <div>
        <header className="flex flex-wrap items-baseline gap-x-3">
          <h3>
            <Link
              to={endpointWithParam("/:username", { username })}
              className={clsx("font-bold", clsLink)}
            >
              {handleName}
            </Link>
          </h3>

          <p className="text-white/50 select-none">
            {username}
            <> • </>
            <span className="text-xs uppercase tracking-wide">
              {formatPostDate(timestamp)}
            </span>
          </p>
        </header>

        <p>{content}</p>
      </div>

      <div>
        {canDelete && (
          <button onClick={promptDelete} className={clsx(clsSmallBtnIcon)}>
            <BsTrashFill />
          </button>
        )}
      </div>
    </article>
  );
}
