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
import { ModalContent } from "../_app/modal/Modal";
import { useModalContext } from "../_app/modal/ModalContext";

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
    setPosts([
      {
        id: 51,
        userId: 2,
        timestamp: new Date("2024-02-02T03:12:19.757Z"),
        content: "One more time for good measure",
        author: {
          id: 2,
          username: "graham-cake",
          handleName: "Graham Cake",
          portraitUrl:
            "https://lh3.googleusercontent.com/a/ACg8ocJC7kxJ4WAxMeyWC0cGfFdofYS20cxiIvH1eCw52V_8=s96-c",
          googleId: "101461882238569466390",
          loginCt: 0,
        },
      },
    ]);
    return;

    setPosts("fetching");
    refreshPosts();
  }, []);

  return { posts, refreshPosts };
});

const [useDeletePostContext, DeletePostProvider] = createNewContext(() => {
  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null);

  return { postToDelete, setPostToDelete };
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

function DeletePostModalContent() {
  const { closeModal } = useModalContext();
  const { postToDelete } = useDeletePostContext();

  // TODO Trigger DELETE on API
  function deletePost() {
    console.warn("Actually delete post");

    closeModal();
  }

  return (
    <ModalContent>
      <h4 className="text-xl font-bold tracking-wide">
        Are you sure you want to delete this post?
      </h4>
      <p>This cannot be undone!</p>

      <div className="grid gap-3 mt-6">
        <button
          onClick={deletePost}
          className={clsx(
            "rounded-full px-6 py-3",
            "font-bold tracking-wide",
            ...[
              "transition",
              "bg-rose-500 hover:bg-red-700",
              "active:scale-95",
            ],
          )}
        >
          Delete 🗑
        </button>
        <button
          onClick={closeModal}
          className={clsx(
            "rounded-full px-6 py-3",
            "outline outline-1 outline-white/50",
            // "font-bold tracking-wide",
            ...["transition", "hover:bg-white/10", "active:scale-95"],
          )}
        >
          Cancel 🙅‍♀️
        </button>
      </div>
    </ModalContent>
  );
}

function formatPostDate(date: PostWithAuthor["timestamp"]): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    includeSeconds: true,
  });
}
function PostCard(props: { post: PostWithAuthor }) {
  const { showOnModal } = useModalContext();
  const { setPostToDelete } = useDeletePostContext();
  const { post } = props;
  const { content, timestamp, author } = post;

  function promptDelete() {
    setPostToDelete(post);
    showOnModal(<DeletePostModalContent />);
  }

  // DELETEME
  useEffect(() => {
    promptDelete();
  }, []);

  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-6 bg-white/10 p-6">
      <div>
        <img
          src={author.portraitUrl}
          alt={`Portrait of "${author.handleName}"`}
          className="w-9 aspect-square rounded-full"
        />
      </div>
      <div>
        <div className="flex items-center gap-3">
          {/* TODO Link to profile? */}
          <h2 className="font-bold">{author.username}</h2>
          <p className="text-xs uppercase tracking-wide opacity-50">
            {formatPostDate(timestamp)}
          </p>
        </div>
        <p>{content}</p>
      </div>
      <div>
        {(() => {
          console.warn("Customize delete button"); // TODO
          return null;
        })()}
        <button onClick={promptDelete} className="bg-yellow-500">
          Delete
        </button>
      </div>
    </article>
  );
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
    <ol className="grid gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ol>
  );
}

export function HomeScreen() {
  return (
    <HomeProvider>
      <DeletePostProvider>
        <Screen className="grid auto-rows-min gap-6 p-6">
          <h1 className="text-3xl">Home</h1>
          <PostForm />
          <PostsList />
        </Screen>
      </DeletePostProvider>
    </HomeProvider>
  );
}
