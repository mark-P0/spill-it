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
import { clsBtn, clsLinkBlock, clsLinkBtnOutline } from "../_app/classes";
import { useToastContext } from "../_app/toast/ToastContext";

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

/** Functionally the same as "unfollowing" */
async function sendCancelFollowRequest(followingUserId: string) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/follows", "DELETE", {
    headers: { Authorization: headerAuth },
    query: { followingUserId },
  });
  if (!result.success) raise("Failed cancelling follow request", result.error);
}
function CancelRequestButton() {
  const revalidator = useRevalidator();
  const { user } = useUserContext();
  const { showOnToast } = useToastContext();
  const { profile } = useProfileLoader();
  const [isProcessing, setIsProcessing] = useState(false);

  async function cancel() {
    if (user?.username === "guest") {
      logger.error("Guests cannot cancel follow requests");
      showOnToast(<>Ready to spill? 😋</>, "info");
      return;
    }

    setIsProcessing(true);
    try {
      logger.debug("Sending cancel follow request...");
      await sendCancelFollowRequest(profile.id);
      showOnToast(
        <>
          Your request to follow {profile.handleName} is now{" "}
          <span className="font-bold">cancelled</span> 💨
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
      onClick={cancel}
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
        Requested
      </span>
      <span className="transition opacity-0 group-enabled:group-hover:opacity-100">
        Cancel
      </span>
    </button>
  );
}

async function sendUnfollow(followingUserId: string) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/follows", "DELETE", {
    headers: { Authorization: headerAuth },
    query: { followingUserId },
  });
  if (!result.success) raise("Failed unfollowing", result.error);
}
function UnfollowButton() {
  const revalidator = useRevalidator();
  const { user } = useUserContext();
  const { showOnToast } = useToastContext();
  const { profile } = useProfileLoader();
  const [isProcessing, setIsProcessing] = useState(false);

  async function unfollow() {
    if (user?.username === "guest") {
      logger.error("Guests cannot unfollow");
      showOnToast(<>Ready to spill? 😋</>, "info");
      return;
    }

    setIsProcessing(true);
    try {
      logger.debug("Sending unfollow request...");
      await sendUnfollow(profile.id);
      showOnToast(
        <>
          You <span className="font-bold">no longer follow</span>{" "}
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

async function sendFollow(followingUserId: string) {
  const headerAuth = getFromStorage("SESS");

  const result = await fetchAPI("/api/v0/follows", "POST", {
    headers: { Authorization: headerAuth },
    query: { followingUserId },
  });
  if (!result.success) raise("Failed following", result.error);
}
function FollowButton() {
  const revalidator = useRevalidator();
  const { user } = useUserContext();
  const { showOnToast } = useToastContext();
  const { profile } = useProfileLoader();
  const [isProcessing, setIsProcessing] = useState(false);

  async function follow() {
    if (user?.username === "guest") {
      logger.error("Guests cannot follow");
      showOnToast(<>Ready to spill? 😋</>, "info");
      return;
    }

    setIsProcessing(true);
    try {
      logger.debug("Sending follow request...");
      await sendFollow(profile.id);

      if (profile.isPrivate) {
        showOnToast(
          <>
            You have sent a <span className="font-bold">request</span> to follow{" "}
            {profile.handleName} 🙏
          </>,
          "info",
        );
      } else {
        showOnToast(
          <>
            You are now <span className="font-bold">following</span>{" "}
            {profile.handleName}! 💅
          </>,
          "info",
        );
      }

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

export function ProfileActionButton() {
  const { user } = useUserContext();
  const { profile, follow } = useProfileLoader();

  if (user === null) return null;

  const isOwnProfile = user.id === profile.id;
  if (isOwnProfile) return <EditProfileButtonLink />;

  const isFollowRequested = follow !== null ? !follow.isAccepted : false;
  if (isFollowRequested) return <CancelRequestButton />;

  const isFollowing = follow?.isAccepted ?? false;
  if (isFollowing) return <UnfollowButton />;

  return <FollowButton />;
}
