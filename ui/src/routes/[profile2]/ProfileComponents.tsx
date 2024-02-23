import clsx from "clsx";
import { BsBoxArrowLeft, BsHouseFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpoint } from "../../utils/endpoints";
import { logger } from "../../utils/logger";
import { useUserContext } from "../_app/UserContext";
import {
  clsBtnIcon,
  clsBtnOutline,
  clsLinkBlock,
  clsLinkBtn,
  clsLinkBtnIcon,
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
