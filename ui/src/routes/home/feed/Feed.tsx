import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import clsx from "clsx";
import { useEffect } from "react";
import { Controller, useObserver } from "../../../utils/react";
import { LoadingIndicator } from "../../_app/Loading";
import { PostCard } from "../../_app/PostCard";
import { useToastContext } from "../../_app/toast/ToastContext";
import { useFeedContext } from "./FeedContext";

function FeedEndObserver() {
  const [divRef, isIntersecting] = useObserver<HTMLDivElement>();

  const { extendFeed } = useFeedContext();
  useEffect(() => {
    if (!isIntersecting) return;
    const ctl: Controller = { shouldProceed: true };
    extendFeed(ctl);
    return () => {
      ctl.shouldProceed = false;
    };
  }, [isIntersecting, extendFeed]);

  return <div ref={divRef}>{isIntersecting && <LoadingIndicator />}</div>;
}

function FeedPostCard(props: { post: PostWithAuthor }) {
  const { removePostFromState } = useFeedContext();
  const { post } = props;

  return <PostCard post={post} onDeleteEnd={() => removePostFromState(post)} />;
}

export function Feed() {
  const { showOnToast } = useToastContext();
  const { feedStatus, feed, hasNextPosts, initializeFeed } = useFeedContext();

  useEffect(() => {
    if (feedStatus !== "error") return;
    showOnToast(<>🥶 We spilt things along the way</>, "warn");
  }, [feedStatus, showOnToast]);
  if (feedStatus === "error") {
    return (
      <div className="grid place-items-center">
        <button
          onClick={initializeFeed}
          className={clsx(
            "select-none",
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
          Load Posts 🔁
        </button>
      </div>
    );
  }

  if (feedStatus === "fetching") {
    return (
      <div className="grid place-items-center">
        <LoadingIndicator />
      </div>
    );
  }
  return (
    <ol className="grid gap-3">
      {feed.map((post) => (
        <li key={post.id}>
          <FeedPostCard post={post} />
        </li>
      ))}
      <li className="grid place-items-center mt-6 mb-3">
        {hasNextPosts ? (
          <FeedEndObserver />
        ) : (
          <p>
            <span className="italic tracking-wide text-white/50">
              More tea later, maybe
            </span>{" "}
            😋
          </p>
        )}
      </li>
    </ol>
  );
}
