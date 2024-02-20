import { UserPublic } from "@spill-it/db/schema/drizzle";
import { ensureError, raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { FormEvent, useEffect, useState } from "react";
import { BsXLg } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";
import { Toast } from "../_app/toast/Toast";
import { ToastProvider, useToastContext } from "../_app/toast/ToastContext";
import { useProfileContext } from "./ProfileContext";

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
            className={clsx(
              "font-bold",
              "underline underline-offset-4",
              ...["transition", "text-white hover:text-fuchsia-500"],
            )}
          >
            {handleName}
          </Link>
        </h3>
        <p className="text-white/50 text-sm">{username}</p>
      </header>
    </article>
  );
}

function FollowersModalContent() {
  const { profile, followers } = useProfileContext();
  const { closeModal } = useModalContext();

  if (profile === null) return;
  if (followers === null) return;

  const { handleName } = profile;
  return (
    <ModalContent>
      <header className="flex items-center gap-6">
        <h2 className="text-xl">
          People who follow <span className="font-bold">{handleName}</span>
        </h2>

        <div className="ml-auto">
          <button
            onClick={closeModal}
            className={clsx(
              "w-9 aspect-square rounded-full p-2",
              ...["transition", "hover:bg-white/25 active:scale-90"],
            )}
          >
            <BsXLg className="w-full h-full" />
          </button>
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
  return (
    <ModalProvider>
      <_FollowersModal />

      <Modal />
    </ModalProvider>
  );
}

function FollowingModalContent() {
  const { profile, followings } = useProfileContext();
  const { closeModal } = useModalContext();

  if (profile === null) return;
  if (followings === null) return;

  const { handleName } = profile;
  return (
    <ModalContent>
      <header className="flex items-center gap-6">
        <h2 className="text-xl">
          People followed by <span className="font-bold">{handleName}</span>
        </h2>

        <div className="ml-auto">
          <button
            onClick={closeModal}
            className={clsx(
              "w-9 aspect-square rounded-full p-2",
              ...["transition", "hover:bg-white/25 active:scale-90"],
            )}
          >
            <BsXLg className="w-full h-full" />
          </button>
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
  return (
    <ModalProvider>
      <_FollowingModal />

      <Modal />
    </ModalProvider>
  );
}
function EditProfileForm() {
  const navigate = useNavigate();
  const { profile } = useProfileContext();
  const { closeModal, makeModalCancellable } = useModalContext();
  const { showOnToast } = useToastContext();

  const [isProcessing, setIsProcessing] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  useEffect(() => {
    if (profile === null) return;
    setNewUsername(profile.username);
  }, [profile]);

  const [newHandleName, setNewHandleName] = useState("");
  useEffect(() => {
    if (profile === null) return;
    setNewHandleName(profile.handleName);
  }, [profile]);

  if (profile === null) return null;

  async function save(event: FormEvent) {
    event.preventDefault();

    if (profile === null) {
      logger.warn("Profile not available; ignoring update...");
      return;
    }

    setIsProcessing(true);
    makeModalCancellable(false);
    try {
      logger.debug("Retrieving session info...");
      const headerAuth = getFromStorage("SESS");

      let username: string | undefined;
      if (newUsername !== profile.username && newUsername !== "") {
        username = newUsername;
      }

      let handleName: string | undefined;
      if (newHandleName !== profile.handleName && newHandleName !== "") {
        handleName = newHandleName;
      }

      logger.debug("Requesting update...");
      const result = await fetchAPI("/api/v0/users/me", "PATCH", {
        headers: { Authorization: headerAuth },
        body: { details: { username, handleName } },
      });
      if (!result.success) raise("Failed updating profile info", result.error);
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");

      setIsProcessing(false);
      makeModalCancellable(true);
      return;
    }

    logger.debug("Finalizing update...");
    showOnToast(<>Success! ✨ Redirecting...</>, "info");
    setTimeout(() => {
      navigate(endpointWithParam("/:username", { username: newUsername }));
    }, 2 * 1000);
  }

  const isFormUnedited =
    newUsername === profile.username && newHandleName === profile.handleName;

  return (
    <form onSubmit={save}>
      <fieldset disabled={isProcessing} className="grid gap-6">
        <header className="flex gap-6">
          <h2 className="text-3xl font-bold">Edit Profile</h2>

          <div className="ml-auto">
            <button
              type="button"
              onClick={closeModal}
              className={clsx(
                "w-9 aspect-square rounded-full p-2",
                ...[
                  "transition",
                  "disabled:opacity-50 enabled:active:scale-90 enabled:hover:bg-white/25 ",
                ],
              )}
            >
              <BsXLg className="w-full h-full" />
            </button>
          </div>
        </header>

        <div className="grid gap-3">
          <label className="grid gap-1 group/input">
            <span className="text-xs uppercase tracking-wide transition text-white/50 group-focus-within/input:text-white">
              Username
            </span>
            <input
              type="text"
              name="username"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="rounded px-2 py-1 bg-transparent transition border border-white/25 group-focus-within/input:text-white"
            />
          </label>

          <label className="grid gap-1 group/input">
            <span className="text-xs uppercase tracking-wide transition text-white/50 group-focus-within/input:text-white">
              Handle Name
            </span>
            <input
              type="text"
              name="handleName"
              value={newHandleName}
              onChange={(event) => setNewHandleName(event.target.value)}
              className="rounded px-2 py-1 bg-transparent transition border border-white/25 group-focus-within/input:text-white"
            />
          </label>
        </div>

        <footer className="flex flex-row-reverse gap-3">
          <button
            disabled={isFormUnedited}
            className={clsx(
              "select-none",
              "rounded-full px-6 py-3",
              "font-bold tracking-wide",
              ...[
                "transition",
                "disabled:opacity-50",
                "enabled:active:scale-95",
                "bg-fuchsia-500 enabled:hover:bg-fuchsia-600",
              ],
            )}
          >
            Save
          </button>
        </footer>
      </fieldset>
    </form>
  );
}
function EditProfileModalContent() {
  return (
    <ModalContent>
      <ToastProvider>
        <EditProfileForm />

        <Toast />
      </ToastProvider>
    </ModalContent>
  );
}
function _EditProfileModal() {
  const navigate = useNavigate();
  const { showOnModal, setOnDismiss } = useModalContext();
  useEffect(() => {
    showOnModal(<EditProfileModalContent />);
    setOnDismiss(() => () => {
      navigate("..");
    });
  }, [showOnModal, setOnDismiss, navigate]);

  return null;
}
export function EditProfileModal() {
  return (
    <ModalProvider>
      <_EditProfileModal />

      <Modal />
    </ModalProvider>
  );
}
