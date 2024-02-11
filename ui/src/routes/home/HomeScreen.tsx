import { safe } from "@spill-it/utils/safe";
import clsx from "clsx";
import { FormEvent, useState } from "react";
import { BsBoxArrowLeft } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpoint, endpointWithParam } from "../../utils/endpoints";
import { fetchAPI } from "../../utils/fetch-api";
import { getFromStorage } from "../../utils/storage";
import { Screen } from "../_app/Screen";
import { useUserContext } from "../_app/UserContext";
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";
import { useToastContext } from "../_app/toast/ToastContext";
import { HomeProvider, useHomeContext } from "./HomeContext";
import { LoadingCursorAbsoluteOverlay } from "./Loading";
import { PostsList } from "./PostsList";

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
        "rounded-full p-2",
        ...["transition", "hover:bg-white/25 active:scale-90"],
      )}
    >
      <BsBoxArrowLeft />
    </button>
  );
}

function ProfileButtonLink() {
  const { user } = useUserContext();

  if (user === null) return null;

  const { username, portraitUrl, handleName } = user;
  return (
    <Link
      to={endpointWithParam("/:username", { username })}
      className={clsx(
        "overflow-clip",
        "w-9 aspect-square rounded-full",
        "border-2 border-white/50",
        ...["transition", "hover:brightness-90 active:scale-95"],
      )}
    >
      <img
        src={portraitUrl}
        alt={`Portrait of "${handleName}"`}
        className="w-full h-full"
      />
    </Link>
  );
}

function PostForm() {
  const { showOnToast } = useToastContext();
  const { extendPostsWithRecent } = useHomeContext();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setContent("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
      setIsSubmitting(false);
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts", "POST", {
      headers: { Authorization: headerAuth },
      body: { content },
    });
    if (!fetchResult.success) {
      console.error(fetchResult.error);
      showOnToast(<>😫 We spilt too much! Please try again.</>, "warn");
      setIsSubmitting(false);
      return;
    }

    extendPostsWithRecent();
    showOnToast(<>Spilt! 😋</>, "info");
    setIsSubmitting(false);
    reset();
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={isSubmitting} className="relative grid gap-3">
        <label>
          <span className="sr-only">Tea 🍵</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.currentTarget.value)}
            placeholder="What's the tea sis?!"
            className={clsx(
              "resize-none placeholder:text-white/50",
              "w-full rounded p-3",
              "bg-white/10 disabled:opacity-50",
            )}
          ></textarea>
        </label>
        <button
          disabled={content === ""}
          className={clsx(
            "ml-auto",
            "select-none",
            "rounded-full px-6 py-3",
            "disabled:opacity-50",
            "font-bold tracking-wide",
            ...[
              "transition",
              "bg-rose-500 enabled:hover:bg-rose-600",
              "enabled:active:scale-95",
            ],
          )}
        >
          {isSubmitting ? <>Spilling...</> : <>Spill! 🍵</>}
        </button>

        {isSubmitting && <LoadingCursorAbsoluteOverlay />}
      </fieldset>
    </form>
  );
}

export function HomeScreen() {
  document.title = "Home 🍵 Spill.it!";

  return (
    <HomeProvider>
      <Screen className="grid auto-rows-min gap-6 p-6">
        <header className="flex items-center gap-3">
          <h1 className="text-3xl">Home</h1>

          <div className="ml-auto flex">
            <ProfileButtonLink />
          </div>
          <LogoutButton />
        </header>
        <PostForm />

        <main>
          <h2 className="sr-only">Spills 🍵</h2>

          <PostsList />
        </main>
      </Screen>
    </HomeProvider>
  );
}
