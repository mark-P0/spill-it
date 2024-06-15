import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { today } from "@spill-it/utils/dates";
import { ensureError, raise } from "@spill-it/utils/errors";
import { sleep } from "@spill-it/utils/sleep";
import clsx from "clsx";
import { differenceInHours, format, formatDistanceToNow } from "date-fns";
import { ComponentProps, useState } from "react";
import { BsLockFill, BsTrashFill } from "react-icons/bs";
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
function DeletePostForm(props: {
  postToDelete: PostWithAuthor;
  onDeleteEnd?: () => void;
}) {
  const { user } = useUserContext();
  const { showOnToast } = useToastContext();
  const { closeModal, makeModalCancellable } = useModalContext();
  const { postToDelete, onDeleteEnd } = props;
  const [isDeleting, setIsDeleting] = useState(false);

  async function triggerDelete() {
    if (user?.username === "guest") {
      logger.error("Guests cannot delete posts");
      showOnToast(<>Ready to spill? 😋</>, "info");
      return;
    }

    if (isDeleting) {
      logger.warn("Cannot delete if already deleting; ignoring...");
      return;
    }

    setIsDeleting(true);
    makeModalCancellable(false);
    try {
      logger.debug("Deleting...");
      await deletePost(postToDelete);
      onDeleteEnd?.();

      showOnToast(<>Spill cleaned... 🧹</>, "critical");
      await sleep(1);
      showOnToast(null);
      closeModal();
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
    }
    setIsDeleting(false);
    makeModalCancellable(true);
  }

  return (
    <form className="relative">
      <h4 className="text-xl font-bold tracking-wide">
        Are you sure you want to delete this post?
      </h4>
      <p>This cannot be undone!</p>

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
  );
}
function DeletePostModalContent(props: ComponentProps<typeof DeletePostForm>) {
  return (
    <ModalContent>
      <DeletePostForm {...props} />
    </ModalContent>
  );
}

function formatPostDate(date: PostWithAuthor["timestamp"]): string {
  const isInThePastDay = differenceInHours(today(), date) < 24;
  if (isInThePastDay) {
    return formatDistanceToNow(date, {
      addSuffix: true,
      includeSeconds: true,
    });
  }

  /**
   * e.g. 16 Mar 2020
   *
   * https://date-fns.org/v3.6.0/docs/format
   */
  const DD_MMM_YYYY = "d LLL y";
  return format(date, DD_MMM_YYYY);
}
function PostDateText(props: { date: Date }) {
  const { date } = props;

  return formatPostDate(date);
}

export function PostCard(props: {
  post: PostWithAuthor;
  onDeleteEnd?: () => void;
}) {
  const { user } = useUserContext();
  const { showOnModal } = useModalContext();
  const { post, onDeleteEnd } = props;
  const { content, timestamp, author } = post;
  const { username, handleName, portraitUrl, isPrivate } = author;

  const canDelete = user?.id === author?.id;

  function promptDelete() {
    showOnModal(
      <DeletePostModalContent postToDelete={post} onDeleteEnd={onDeleteEnd} />,
    );
  }

  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-lg p-4 bg-white/10">
      <div>
        <img
          src={portraitUrl}
          alt={`Portrait of "${handleName}"`}
          className="w-9 aspect-square rounded-full"
        />
      </div>

      <div>
        <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3>
            <Link
              to={endpointWithParam("/:username", { username })}
              className={clsx("font-bold", clsLink)}
            >
              {handleName}
            </Link>
          </h3>

          {isPrivate && (
            <div>
              <BsLockFill className="text-emerald-500" />
            </div>
          )}

          <span className="text-white/50 select-none text-sm">{username}</span>
          <span className="text-white/50 select-none">•</span>
          <span className="text-white/50 select-none text-xs uppercase tracking-wide">
            <PostDateText date={timestamp} />
          </span>
        </header>

        <p className="mt-1 whitespace-pre-wrap">{content}</p>
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
