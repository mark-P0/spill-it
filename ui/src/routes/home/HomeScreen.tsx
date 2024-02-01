import { safe } from "@spill-it/utils/safe";
import clsx from "clsx";
import { FormEvent, useState } from "react";
import { ToastProviderWithComponent } from "../../components/Toast";
import { useToastContext } from "../../contexts/toast";
import { fetchAPI } from "../../utils/fetch-api";
import { buildHeaderAuthFromStorage } from "../../utils/is-logged-in";

function PostForm() {
  const { setToastAttrs } = useToastContext();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setContent("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const headerAuthResult = safe(() => buildHeaderAuthFromStorage());
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
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
      setToastAttrs({
        content: "😫 We spilt too much! Please try again.",
        level: "warn",
      });
      setIsSubmitting(false);
      return;
    }

    setToastAttrs({
      content: "Spilt! 😋",
      level: "info",
    });
    setIsSubmitting(false);
    reset();
  }

  /**
   * More reliable for showing a cursor over the whole form
   * as the interactive elements override it with their respective styles
   */
  const CursorOverlay = (
    <div className="absolute w-full h-full cursor-wait"></div>
  );
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
            "rounded-full px-6 py-3",
            "bg-rose-500 disabled:opacity-50",
            "font-bold tracking-wide",
          )}
        >
          {isSubmitting ? <>Spilling...</> : <>Spill! 🍵</>}
        </button>
        {isSubmitting && CursorOverlay}
      </fieldset>
    </form>
  );
}

export function HomeScreen() {
  return (
    <ToastProviderWithComponent>
      <div
        className={clsx(
          "min-h-screen",
          "grid auto-rows-min gap-6 p-6",
          "bg-fuchsia-950 text-white",
        )}
      >
        <h1 className="text-3xl">Home</h1>
        <PostForm />
      </div>
    </ToastProviderWithComponent>
  );
}
