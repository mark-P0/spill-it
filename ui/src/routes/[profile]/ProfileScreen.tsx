import clsx from "clsx";
import { BsBoxArrowLeft, BsHouseFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpoint } from "../../utils/endpoints";
import { Screen } from "../_app/Screen";
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";
import { useProfileLoader } from "./load-profile";

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

function HomeButtonLink() {
  return (
    <Link
      to={endpoint("/home")}
      className={clsx(
        "w-9 aspect-square rounded-full p-2",
        ...["transition", "hover:bg-white/25 active:scale-90"],
      )}
    >
      <BsHouseFill className="w-full h-full" />
    </Link>
  );
}

export function ProfileScreen() {
  const profile = useProfileLoader();
  const { handleName, username, portraitUrl } = profile;

  document.title = `${handleName} (${username}) 👀 Spill.it!`;

  return (
    <Screen className="grid auto-rows-min gap-6 p-6">
      <header className="grid grid-rows-subgrid row-span-2">
        <nav className="flex justify-between items-center">
          <LogoutButton />
          <HomeButtonLink />
        </nav>

        <section className="flex justify-between">
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
        </section>
      </header>

      <main>
        <pre>posts</pre>
      </main>
    </Screen>
  );
}
