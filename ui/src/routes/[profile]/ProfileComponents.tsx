import { ensureError, raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { useState } from "react";
import { BsBoxArrowLeft, BsHouseFill } from "react-icons/bs";
import { Link, useRevalidator } from "react-router-dom";
import { endpoint, endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { useProfileLoader } from "../[profile]";
import { useUserContext } from "../_app/UserContext";
import {
  clsBtn,
  clsBtnIcon,
  clsBtnOutline,
  clsLinkBlock,
  clsLinkBtn,
  clsLinkBtnIcon,
  clsLinkBtnOutline,
  clsLinkTranslucent,
} from "../_app/classes";
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";
import { useToastContext } from "../_app/toast/ToastContext";

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
            "text-center", // Link/Anchor texts are not centered by default like in buttons
            clsLinkBtn,
          )}
        >
          Yes 👋
        </Link>
        <button
          type="button"
          onClick={closeModal}
          className={clsx(clsBtnOutline)}
        >
          On second thought...
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
    <button onClick={promptLogout} className={clsx(clsBtnIcon)}>
      <BsBoxArrowLeft />
    </button>
  );
}

export function NavBar() {
  const { user } = useUserContext();
  const { profile } = useProfileLoader();

  const isProfileOfUser = profile.id === user?.id;

  return (
    <nav className="flex items-center">
      {
        isProfileOfUser ? <LogoutButton /> : <Nothing /> // Use placeholder to not affect layout
      }

      <div className="ml-auto">
        <Link
          to={endpoint("/home")}
          className={clsx(clsLinkBlock, clsLinkBtnIcon)}
        >
          <BsHouseFill />
        </Link>
      </div>
    </nav>
  );
}

function FollowCountsNav() {
  const { profile, followers, followings } = useProfileLoader();

  const { username } = profile;

  return (
    <nav className="flex gap-3">
      <Link
        to={endpointWithParam("/:username/followers", { username })}
        className={clsx("text-xs uppercase tracking-wide", clsLinkTranslucent)}
      >
        <span className="font-bold text-base">{followers.length}</span>{" "}
        {followers.length === 1 ? <>follower</> : <>followers</>}
      </Link>

      <Link
        to={endpointWithParam("/:username/following", { username })}
        className={clsx("text-xs uppercase tracking-wide", clsLinkTranslucent)}
      >
        <span className="font-bold text-base">{followings.length}</span>{" "}
        following
      </Link>
    </nav>
  );
}

function EditProfileButtonLink() {
  const { user } = useUserContext();

  if (user === null) return null;

  const { username } = user;
  return (
    <Link
      to={endpointWithParam("/:username/edit", { username })}
      className={clsx(
        "font-bold tracking-wide",
        clsLinkBlock,
        clsLinkBtnOutline,
      )}
    >
      Edit Profile
    </Link>
  );
}

async function requestUnfollow(followingUserId: string) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/follows", "DELETE", {
    headers: { Authorization: headerAuth },
    query: { followingUserId },
  });
  if (!result.success) raise("Failed unfollowing", result.error);
}
function UnfollowButton() {
  const revalidator = useRevalidator();
  const { showOnToast } = useToastContext();
  const { profile } = useProfileLoader();
  const [isProcessing, setIsProcessing] = useState(false);

  async function unfollow() {
    setIsProcessing(true);
    try {
      logger.debug("Sending unfollow request...");
      await requestUnfollow(profile.id);
      showOnToast(
        <>
          You have now <span className="font-bold">unfollowed</span>{" "}
          {profile.handleName} 😢
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

  const isRevalidating = revalidator.state === "loading";

  return (
    <button
      disabled={isProcessing || isRevalidating}
      onClick={unfollow}
      className={clsx(
        "disabled:cursor-wait", // TODO Use overlay?
        "font-bold tracking-wide",
        "select-none",
        "rounded-full px-6 py-3", // Based on styles for outline buttons
        ...[
          "transition",
          "disabled:opacity-50",
          "enabled:active:scale-95",
          ...[
            "border",
            "border-white/25 enabled:hover:border-transparent",
            "text-white enabled:hover:bg-red-700",
          ],
        ],
        "grid *:row-[1] *:col-[1]",
        "group",
      )}
    >
      <span className="transition opacity-100 group-enabled:group-hover:opacity-0">
        Following
      </span>
      <span className="transition opacity-0 group-enabled:group-hover:opacity-100">
        Unfollow
      </span>
    </button>
  );
}

async function requestFollow(followingUserId: string) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/follows", "POST", {
    headers: { Authorization: headerAuth },
    query: { followingUserId },
  });
  if (!result.success) raise("Failed following", result.error);
}
function FollowButton() {
  const revalidator = useRevalidator();
  const { showOnToast } = useToastContext();
  const { profile } = useProfileLoader();
  const [isProcessing, setIsProcessing] = useState(false);

  async function follow() {
    setIsProcessing(true);
    try {
      logger.debug("Sending follow request...");
      await requestFollow(profile.id);
      showOnToast(
        <>
          You are now <span className="font-bold">following</span>{" "}
          {profile.handleName}! 💅
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

  const isRevalidating = revalidator.state === "loading";

  return (
    <button
      disabled={isProcessing || isRevalidating}
      onClick={follow}
      className={clsx(
        "disabled:cursor-wait", // TODO Use overlay?
        clsBtn,
      )}
    >
      Follow
    </button>
  );
}

function ActionButton() {
  const { user } = useUserContext();
  const { profile, followers } = useProfileLoader();

  if (user === null) return null;

  if (user.id === profile.id) return <EditProfileButtonLink />;

  const isFollowing = followers.some(({ follower }) => follower.id === user.id);
  if (isFollowing) return <UnfollowButton />;

  return <FollowButton />;
}

export function ProfileCard() {
  const { profile } = useProfileLoader();

  const { handleName, username, portraitUrl } = profile;

  return (
    <article className="flex gap-6">
      <header>
        <h1 className="text-3xl font-bold">{handleName}</h1>
        <p className="text-lg text-white/50">{username}</p>
        <FollowCountsNav />
      </header>
      <div>
        <ActionButton />
      </div>
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
