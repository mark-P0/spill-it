import { UserPublic } from "@spill-it/db/schema/drizzle";
import { ensureError, raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { BsCheck, BsPersonPlusFill, BsX, BsXLg } from "react-icons/bs";
import { Link, useNavigate, useRevalidator } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { useProfileLoader } from "../[profile]";
import { LoadingCursorAbsoluteOverlay } from "../_app/Loading";
import { useUserContext } from "../_app/UserContext";
import { clsBtnIcon, clsLink } from "../_app/classes";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";
import { Toast } from "../_app/toast/Toast";
import { ToastProvider, useToastContext } from "../_app/toast/ToastContext";

function UserCard(props: { user: UserPublic }) {
  const { user } = props;

  const { handleName, username, portraitUrl } = user;
  return (
    <article className="flex items-center gap-3 rounded p-3 bg-white/10">
      <img
        src={portraitUrl}
        alt={`Portrait of "${handleName}"`}
        className="w-9 aspect-square rounded-full"
      />
      <header>
        <h3>
          <Link
            to={endpointWithParam("/:username", { username })}
            className={clsx("font-bold", clsLink)}
          >
            {handleName}
          </Link>
        </h3>
        <p className="text-white/50 text-sm">{username}</p>
      </header>
    </article>
  );
}

/** Functionally the same as "unfollowing" */
async function sendDeclineFollowRequest(followerUserId: string) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/follows", "DELETE", {
    headers: { Authorization: headerAuth },
    query: { followerUserId },
  });
  if (!result.success) raise("Failed declining follow request", result.error);
}
async function sendAcceptFollowRequest(followerUserId: string) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/follows", "PATCH", {
    headers: { Authorization: headerAuth },
    query: { followerUserId },
    body: { details: { isAccepted: true } },
  });
  if (!result.success) raise("Failed accepting follow request", result.error);
}
// TODO Reuse existing user card?
function RequestingUserCard(props: { user: UserPublic }) {
  const revalidator = useRevalidator();
  const { showOnToast } = useToastContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = props;

  async function decline() {
    setIsProcessing(true);
    try {
      logger.debug("Sending decline follow request...");
      await sendDeclineFollowRequest(user.id);
      showOnToast(
        <>
          You have rejected the request of{" "}
          <span className="font-bold">{user.handleName}</span> 👋
        </>,
        "critical",
      );

      logger.debug("Revalidating profile...");
      revalidator.revalidate();
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
    }
    setIsProcessing(false);
  }
  async function accept() {
    setIsProcessing(true);
    try {
      logger.debug("Sending accept follow request...");
      await sendAcceptFollowRequest(user.id);
      showOnToast(
        <>
          <span className="font-bold">{user.handleName}</span> is now following
          you! 🎊
        </>,
        "info",
      );

      logger.debug("Revalidating profile...");
      revalidator.revalidate();
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
    }
    setIsProcessing(false);
  }

  const { handleName, username, portraitUrl } = user;
  const isLoading = isProcessing || revalidator.state === "loading";

  return (
    <article className="flex items-center gap-3 rounded p-3 bg-white/10">
      <img
        src={portraitUrl}
        alt={`Portrait of "${handleName}"`}
        className="w-9 aspect-square rounded-full"
      />
      <header>
        <h3>
          <Link
            to={endpointWithParam("/:username", { username })}
            className={clsx("font-bold", clsLink)}
          >
            {handleName}
          </Link>
        </h3>
        <p className="text-white/50 text-sm">{username}</p>
      </header>

      <div className="ml-auto">
        <form>
          <fieldset
            disabled={isLoading}
            className="flex flex-row-reverse items-center"
          >
            <button
              type="button"
              onClick={decline}
              className={clsx(clsBtnIcon, "enabled:hover:!bg-red-700")}
            >
              <BsX className="w-full h-full" />
            </button>
            <button
              type="button"
              onClick={accept}
              className={clsx(clsBtnIcon, "enabled:hover:!bg-fuchsia-600")}
            >
              <BsCheck type="button" className="w-full h-full" />
            </button>
          </fieldset>

          {isLoading && <LoadingCursorAbsoluteOverlay />}
        </form>
      </div>
    </article>
  );
}

function FollowerRequestsModalContent() {
  const { followerRequests } = useProfileLoader();
  const { closeModal } = useModalContext();

  return (
    <ModalContent>
      <ToastProvider>
        <header className="flex items-center gap-6">
          <h2 className="text-xl font-bold tracking-wide">
            People requesting to follow you
          </h2>

          <div className="ml-auto flex flex-row-reverse">
            <button onClick={closeModal} className={clsx(clsBtnIcon)}>
              <BsXLg className="w-full h-full" />
            </button>
          </div>
        </header>

        <ol className="mt-3 grid gap-1">
          {followerRequests?.map(({ follower }) => (
            <RequestingUserCard key={follower.id} user={follower} />
          ))}
        </ol>

        <Toast />
      </ToastProvider>
    </ModalContent>
  );
}
function FollowersModalContent() {
  const { user } = useUserContext();
  const { profile, followers } = useProfileLoader();
  const { closeModal, showOnModal } = useModalContext();

  function showFollowerRequests() {
    showOnModal(<FollowerRequestsModalContent />);
  }

  if (profile === null) return;
  if (followers === null) return;

  const { handleName } = profile;
  const isOwnProfile = user?.id === profile.id;

  return (
    <ModalContent>
      <header className="flex items-center gap-6">
        <h2 className="text-xl">
          People who follow <span className="font-bold">{handleName}</span>
        </h2>

        <div className="ml-auto flex flex-row-reverse">
          <button onClick={closeModal} className={clsx(clsBtnIcon)}>
            <BsXLg />
          </button>
          {isOwnProfile && (
            <button onClick={showFollowerRequests} className={clsx(clsBtnIcon)}>
              <BsPersonPlusFill className="w-full h-full" />
            </button>
          )}
        </div>
      </header>

      <ol className="mt-3 grid gap-1">
        {followers.map(({ follower }) => (
          <UserCard key={follower.id} user={follower} />
        ))}
      </ol>
    </ModalContent>
  );
}
function _FollowersModal() {
  const navigate = useNavigate();
  const { showOnModal, setOnDismiss } = useModalContext();
  useEffect(() => {
    showOnModal(<FollowersModalContent />);
    setOnDismiss(() => () => {
      navigate("..");
    });
  }, [showOnModal, setOnDismiss, navigate]);

  return null;
}
export function FollowersModal() {
  const { followers } = useProfileLoader();

  if (followers === null) {
    throw new Error("Followers info not available");
  }

  return (
    <ModalProvider>
      <_FollowersModal />

      <Modal />
    </ModalProvider>
  );
}

function FollowingRequestsModalContent() {
  const { followingRequests } = useProfileLoader();
  const { closeModal } = useModalContext();

  return (
    <ModalContent>
      <header className="flex items-center gap-6">
        <h2 className="text-xl font-bold tracking-wide">
          People you requested to follow
        </h2>

        <div className="ml-auto flex flex-row-reverse">
          <button onClick={closeModal} className={clsx(clsBtnIcon)}>
            <BsXLg className="w-full h-full" />
          </button>
        </div>
      </header>

      <ol className="mt-3 grid gap-1">
        {followingRequests?.map(({ following }) => (
          <UserCard key={following.id} user={following} />
        ))}
      </ol>
    </ModalContent>
  );
}
function FollowingModalContent() {
  const { user } = useUserContext();
  const { profile, followings } = useProfileLoader();
  const { closeModal, showOnModal } = useModalContext();

  function showFollowingRequests() {
    showOnModal(<FollowingRequestsModalContent />);
  }

  if (profile === null) return;
  if (followings === null) return;

  const { handleName } = profile;
  const isOwnProfile = user?.id === profile.id;

  return (
    <ModalContent>
      <header className="flex items-center gap-6">
        <h2 className="text-xl">
          People followed by <span className="font-bold">{handleName}</span>
        </h2>

        <div className="ml-auto flex flex-row-reverse">
          <button onClick={closeModal} className={clsx(clsBtnIcon)}>
            <BsXLg className="w-full h-full" />
          </button>
          {isOwnProfile && (
            <button
              onClick={showFollowingRequests}
              className={clsx(clsBtnIcon)}
            >
              <BsPersonPlusFill className="w-full h-full" />
            </button>
          )}
        </div>
      </header>

      <ol className="mt-3 grid gap-1">
        {followings.map(({ following }) => (
          <UserCard key={following.id} user={following} />
        ))}
      </ol>
    </ModalContent>
  );
}
function _FollowingModal() {
  const navigate = useNavigate();
  const { showOnModal, setOnDismiss } = useModalContext();
  useEffect(() => {
    showOnModal(<FollowingModalContent />);
    setOnDismiss(() => () => {
      navigate("..");
    });
  }, [showOnModal, setOnDismiss, navigate]);

  return null;
}
export function FollowingModal() {
  const { followings } = useProfileLoader();

  if (followings === null) {
    throw new Error("Followings info not available");
  }

  return (
    <ModalProvider>
      <_FollowingModal />

      <Modal />
    </ModalProvider>
  );
}
