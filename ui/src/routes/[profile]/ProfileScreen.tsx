import clsx from "clsx";
import { BsBoxArrowLeft, BsHouseFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpoint } from "../../utils/endpoints";
import { logger } from "../../utils/logger";
import { Screen } from "../_app/Screen";
import { useUserContext } from "../_app/UserContext";
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";
import { ProfileProvider, useProfileContext } from "./ProfileContext";
import { PostsProvider } from "./posts/PostsContext";
import { PostsList } from "./posts/PostsList";

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

function NavBar() {
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
function ProfileCard() {
  const { profile } = useProfileContext();

  if (profile === null) return null;
  const { handleName, username, portraitUrl } = profile;

  return (
    <article className="flex justify-between">
      <div>
        <h1 className="text-3xl font-bold">{handleName}</h1>
        <p className="text-lg text-white/50">{username}</p>
      </div>
      <div>
        <img
          src={portraitUrl}
          alt={`Portrait of "${handleName}"`}
          className="w-20 aspect-square rounded-full"
        />
      </div>
    </article>
  );
}

function _ProfileScreen() {
  const { profile } = useProfileContext();
  if (profile !== null) {
    const { handleName, username } = profile;
    document.title = `${handleName} (${username}) 👀 Spill.it!`;
  }

  return (
    <Screen className="grid auto-rows-min gap-6 p-6">
      <header className="grid grid-rows-subgrid row-span-2">
        <NavBar />
        <ProfileCard />
      </header>

      <main>
        <h2 className="sr-only">Spills 🍵</h2>

        <PostsList />
      </main>
    </Screen>
  );
}
export function ProfileScreen() {
  return (
    <ProfileProvider>
      <PostsProvider>
        <_ProfileScreen />
      </PostsProvider>
    </ProfileProvider>
  );
}
