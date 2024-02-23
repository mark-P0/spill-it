import clsx from "clsx";
import { BsBoxArrowLeft, BsHouseFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpoint, endpointWithParam } from "../../utils/endpoints";
import { logger } from "../../utils/logger";
import { useUserContext } from "../_app/UserContext";
import {
  clsBtnIcon,
  clsBtnOutline,
  clsLinkBlock,
  clsLinkBtn,
  clsLinkBtnIcon,
  clsLinkTranslucent,
} from "../_app/classes";
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";
import { useProfileLoader } from "./profile-loader";

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
      <div>{/* <ActionButton /> */}</div>
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
