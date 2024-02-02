import { PostWithAuthor } from "@spill-it/db/tables/posts";
import { safe } from "@spill-it/utils/safe";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { FormEvent, useEffect, useState } from "react";
import { Screen } from "../../components/Screen";
import { useToastContext } from "../../contexts/toast";
import { fetchAPI } from "../../utils/fetch-api";
import { buildHeaderAuthFromStorage } from "../../utils/is-logged-in";
import { createNewContext } from "../../utils/react";

const [useHomeContext, HomeProvider] = createNewContext(() => {
  const [posts, setPosts] = useState<PostWithAuthor[] | "fetching" | "error">(
    "fetching",
  );

  async function refreshPosts() {
    const headerAuthResult = safe(() => buildHeaderAuthFromStorage());
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      setPosts("error");
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts", "GET", {
      headers: { Authorization: headerAuth },
    });
    if (!fetchResult.success) {
      console.error(fetchResult.error);
      setPosts("error");
      return;
    }
    const { data } = fetchResult.value;

    setPosts(data);
  }

  useEffect(() => {
    setPosts("fetching");
    refreshPosts();
  }, []);

  return { posts, refreshPosts };
});

function PostForm() {
  const { setToastAttrs } = useToastContext();
  const { refreshPosts } = useHomeContext();
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

    refreshPosts();
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

function formatPostDate(date: PostWithAuthor["timestamp"]): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    includeSeconds: true,
  });
}
function PostsList() {
  const { setToastAttrs } = useToastContext();
  const { posts } = useHomeContext();

  useEffect(() => {
    if (posts !== "error") return;

    // TODO Allow retrying from toast?
    setToastAttrs({
      content: "🥶 We spilt things along the way",
      level: "warn",
    });
  }, [posts, setToastAttrs]);
  if (posts === "error") return null; // The "output" is the toast above

  if (posts === "fetching") return "fetching"; // TODO Use loading component?
  return (
    <ol>
      {posts.map((post) => (
        <li key={post.id}>
          {post.content}{" "}
          <span className="text-xs uppercase tracking-wide opacity-50">
            {formatPostDate(post.timestamp)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function HomeScreen() {
  return (
    <HomeProvider>
      <Screen className="grid auto-rows-min gap-6 p-6">
        <h1 className="text-3xl">Home</h1>
        <PostForm />

        <PostsList />
      </Screen>
    </HomeProvider>
  );
}
