import { UserPublic } from "@spill-it/db/schema/drizzle";
import clsx from "clsx";
import { useEffect } from "react";
import { BsXLg } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";
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

function EditProfileModalContent() {
  const { profile } = useProfileContext();
  const { closeModal } = useModalContext();

  if (profile === null) return null;

  return (
    <ModalContent>
      <form className="grid gap-6 group">
        <header className="flex gap-6">
          <h2 className="text-3xl font-bold">Edit Profile</h2>

          <div className="ml-auto">
            <button
              type="button"
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

        <fieldset className="grid gap-3">
          <label className="grid gap-1 group/input">
            <span className="text-xs uppercase tracking-wide transition text-white/50 group-focus-within/input:text-white">
              Username
            </span>
            <input
              type="text"
              className="rounded px-2 py-1 bg-transparent transition border border-white/25 group-focus-within/input:text-white"
            />
          </label>

          <label className="grid gap-1 group/input">
            <span className="text-xs uppercase tracking-wide transition text-white/50 group-focus-within/input:text-white">
              Handle Name
            </span>
            <input
              type="text"
              className="rounded px-2 py-1 bg-transparent transition border border-white/25 group-focus-within/input:text-white"
            />
          </label>
        </fieldset>

        <footer className="flex flex-row-reverse gap-3">
          <button
            type="button"
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
      </form>
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
