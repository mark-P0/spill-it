import { ensureError, raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { useState } from "react";
import { BsBoxArrowLeft, BsHouseFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpoint, endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { useUserContext } from "../_app/UserContext";
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";
import { useToastContext } from "../_app/toast/ToastContext";
import { useProfileContext } from "./ProfileContext";

/**
 * Can be used to place an "element" (it is a text node) where desired but not necessarily "visible"
 *
 * Alternative entities include:
 * - `&nbsp;`
 * - `&#8203;` Zero-width space
 *
 * ---
 *
 * - https://github.com/typora/typora-issues/issues/4136
 * - https://levelup.gitconnected.com/the-zero-width-space-77543a28c984
 */
function Nothing() {
  return <>&zwj;</>;
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
            "text-center select-none",
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
            "select-none",
            "rounded-full px-6 py-3",
            "disabled:opacity-50",
            "border border-white/25",
            ...["transition", "hover:bg-white/10 active:scale-95"],
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
    logger.debug("Showing logout prompt...");
    showOnModal(<LogoutModalContent />);
  }

  return (
    <button
      onClick={promptLogout}
      className={clsx(
        "w-9 aspect-square rounded-full p-2",
        ...["transition", "hover:bg-white/25 active:scale-90"],
      )}
    >
      <BsBoxArrowLeft className="w-full h-full" />
    </button>
  );
}

export function NavBar() {
  const { user } = useUserContext();
  const { profile } = useProfileContext();

  const isProfileOfUser = profile?.id === user?.id;
  return (
    <nav className="flex justify-between items-center">
      {
        isProfileOfUser ? <LogoutButton /> : <Nothing /> // Use placeholder to not affect layout
      }

      <Link
        to={endpoint("/home")}
        className={clsx(
          "w-9 aspect-square rounded-full p-2",
          ...["transition", "hover:bg-white/25 active:scale-90"],
        )}
      >
        <BsHouseFill className="w-full h-full" />
      </Link>
    </nav>
  );
}

function FollowButton() {
  const { user } = useUserContext();
  const { showOnToast } = useToastContext();
  const { profile, initializeProfile } = useProfileContext();
  const [isProcessing, setIsProcessing] = useState(false);

  if (user === null) return null;
  if (profile === null) return null;
  if (user.id === profile.id) return null; // Self-following is not a supported concept

  const { followers } = profile;
  const isFollowing = followers.some(({ follower }) => follower.id === user.id);

  async function follow() {
    setIsProcessing(true);
    try {
      if (profile === null) raise("Profile is not available yet");

      logger.debug("Retrieving session info...");
      const headerAuth = getFromStorage("SESS");

      logger.debug("Requesting follow...");
      const result = await fetchAPI("/api/v0/follows", "POST", {
        headers: { Authorization: headerAuth },
        query: {
          followingUserId: profile.id,
        },
      });
      if (!result.success) raise("Failed following", result.error);

      initializeProfile();
    } catch (caughtError) {
      logger.error(ensureError(caughtError));
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
    }
    setIsProcessing(false);
  }
  async function unfollow() {}

  return (
    <button
      disabled={isProcessing}
      onClick={isFollowing ? unfollow : follow}
      className={clsx(
        isProcessing && "cursor-wait",
        "select-none",
        "rounded-full px-6 py-3",
        "disabled:opacity-50",
        "font-bold tracking-wide",
        ...[
          "transition",
          "bg-fuchsia-500",
          isFollowing
            ? "enabled:hover:bg-red-700"
            : "enabled:hover:bg-fuchsia-600",
          "enabled:active:scale-95",
        ],
        "group",
      )}
    >
      {isFollowing ? (
        <span className="grid *:row-[1] *:col-[1]">
          <span className="transition opacity-100 group-hover:opacity-0">
            Following
          </span>
          <span className="transition opacity-0 group-hover:opacity-100">
            Unfollow
          </span>
        </span>
      ) : (
        <>Follow</>
      )}
    </button>
  );
}

export function ProfileCard() {
  const { profile } = useProfileContext();

  if (profile === null) return null;
  const { handleName, username, portraitUrl } = profile;
  const { followers, followings } = profile;

  return (
    <article className="flex items-start gap-6">
      <header>
        <h1 className="relative text-3xl font-bold">
          {handleName}
          <div className="absolute top-0 left-full translate-x-6"></div>
        </h1>
        <p className="text-lg text-white/50">{username}</p>
        <nav className="mt-1 flex gap-3">
          <Link
            to={endpointWithParam("/:username/followers", { username })}
            className={clsx(
              "text-xs uppercase tracking-wide",
              "underline underline-offset-4",
              ...["transition", "text-white/50 hover:text-fuchsia-500"],
            )}
          >
            <span className="font-bold text-sm">{followers.length}</span>{" "}
            {followers.length === 1 ? <>follower</> : <>followers</>}
          </Link>
          <Link
            to={endpointWithParam("/:username/following", { username })}
            className={clsx(
              "text-xs uppercase tracking-wide",
              "underline underline-offset-4",
              ...["transition", "text-white/50 hover:text-fuchsia-500"],
            )}
          >
            <span className="font-bold text-sm">{followings.length}</span>{" "}
            following
          </Link>
        </nav>
      </header>

      <FollowButton />

      <div className="ml-auto">
        <img
          src={portraitUrl}
          alt={`Portrait of "${handleName}"`}
          className="w-20 aspect-square rounded-full"
        />
      </div>
    </article>
  );
}
