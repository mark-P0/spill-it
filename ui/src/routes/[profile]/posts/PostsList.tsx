import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import clsx from "clsx";
import { useEffect } from "react";
import { logger } from "../../../utils/logger";
import { Controller, useObserver } from "../../../utils/react";
import { LoadingIndicator } from "../../_app/Loading";
import { PostCard } from "../../_app/PostCard";
import { clsBtn } from "../../_app/classes";
import { useToastContext } from "../../_app/toast/ToastContext";
import { usePostsContext } from "./PostsContext";

function PostsListEndObserver() {
  const [divRef, isIntersecting] = useObserver<HTMLDivElement>();

  const { extendPosts } = usePostsContext();
  useEffect(() => {
    if (!isIntersecting) return;

    logger.debug("Extending posts...");
    const ctl: Controller = { shouldProceed: true };
    extendPosts(ctl);

    return () => {
      logger.debug("Cancelling posts extension...");
      ctl.shouldProceed = false;
    };
  }, [isIntersecting, extendPosts]);

  return <div ref={divRef}>{isIntersecting && <LoadingIndicator />}</div>;
}

function ProfilePostCard(props: { post: PostWithAuthor }) {
  const { removePostFromState } = usePostsContext();
  const { post } = props;

  return <PostCard post={post} onDeleteEnd={() => removePostFromState(post)} />;
}

export function PostsList() {
  const { showOnToast } = useToastContext();
  const { postsStatus, posts, hasNextPosts, initializePosts } =
    usePostsContext();

  function reinitializePosts() {
    logger.debug("Re-initializing posts...");
    initializePosts();
  }

  useEffect(() => {
    if (postsStatus !== "error") return;
    showOnToast(<>🥶 We spilt things along the way</>, "warn");
  }, [postsStatus, showOnToast]);
  if (postsStatus === "error") {
    return (
      <div className="grid place-items-center">
        <button onClick={reinitializePosts} className={clsx(clsBtn)}>
          Load Posts 🔁
        </button>
      </div>
    );
  }

  if (postsStatus === "fetching") {
    return (
      <div className="grid place-items-center">
        <LoadingIndicator />
      </div>
    );
  }
  return (
    <ol className="grid gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <ProfilePostCard post={post} />
        </li>
      ))}
      <li className="grid place-items-center mt-6 mb-3">
        {hasNextPosts ? (
          <PostsListEndObserver />
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
