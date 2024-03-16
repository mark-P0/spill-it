import { ensureError, raise } from "@spill-it/utils/errors";
import clsx from "clsx";
import { useState } from "react";
import { Link, useRevalidator } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { logger } from "../../utils/logger";
import { getFromStorage } from "../../utils/storage";
import { useProfileLoader } from "../[profile]";
import { useUserContext } from "../_app/UserContext";
import {
  clsBtn,
  clsLinkBlock,
  clsLinkBtnOutline,
  clsLinkTranslucent,
} from "../_app/classes";
import { useToastContext } from "../_app/toast/ToastContext";

function FollowCountsNav() {
  const { profile, followers, followings } = useProfileLoader();
  const { username } = profile;

  if (followers === null || followings === null) return null;

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

  const isFollowing =
    followers?.some(({ follower }) => follower.id === user.id) ?? false;
  if (isFollowing) return <UnfollowButton />;

  return <FollowButton />;
}

export function ProfileCard() {
  const { profile } = useProfileLoader();

  const { handleName, username, bio, portraitUrl } = profile;

  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-x-6">
      <div>
        <header>
          <h1 className="text-3xl font-bold">{handleName}</h1>
          <p className="text-lg text-white/50">{username}</p>
        </header>
      </div>

      <div className="col-span-2">
        {bio !== "" && <p className="my-1">{bio}</p>}
      </div>

      <div className="col-span-2">
        <FollowCountsNav />
      </div>

      <div className="col-start-2 row-start-1 place-self-start">
        <ActionButton />
      </div>

      <div className="col-start-3 row-start-1 row-span-3">
        <img
          src={portraitUrl}
          alt={`Portrait of "${handleName}"`}
          className="w-20 aspect-square rounded-full"
        />
      </div>
    </article>
  );
}
