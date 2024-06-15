import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { ensureError, raise } from "@spill-it/utils/errors";
import { sleep } from "@spill-it/utils/sleep";
import clsx from "clsx";
import { ComponentProps, useState } from "react";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { LoadingCursorAbsoluteOverlay } from "./Loading";
import { useUserContext } from "./UserContext";
import { clsBtnNegative, clsBtnOutline } from "./classes";
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

function PostDeletionForm(props: {
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

export function PostDeletionModalContent(
  props: ComponentProps<typeof PostDeletionForm>,
) {
  return (
    <ModalContent>
      <PostDeletionForm {...props} />
    </ModalContent>
  );
}
