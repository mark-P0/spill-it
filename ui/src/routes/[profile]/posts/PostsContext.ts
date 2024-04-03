import { POSTS_IN_VIEW_CT } from "@spill-it/constraints";
import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { tomorrow } from "@spill-it/utils/dates";
import { safe } from "@spill-it/utils/safe";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../../../utils/fetch-api";
import { logger } from "../../../utils/logger";
import { Controller, createNewContext } from "../../../utils/react";
import { getFromStorage } from "../../../utils/storage";
import { useProfileLoader } from "../../[profile]";

type PostStatus = "fetching" | "error" | "ok";
export const [usePostsContext, PostsProvider] = createNewContext(() => {
  const { profile } = useProfileLoader();
  const [postsStatus, setPostsStatus] = useState<PostStatus>("fetching");

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const initializePosts = useCallback(async () => {
    setPostsStatus("fetching");

    const headerAuthResult = safe(() => getFromStorage("SESS"));
    const headerAuth = headerAuthResult.success
      ? headerAuthResult.value
      : undefined;

    const fetchResult = await fetchAPI("/api/v0/posts", "GET", {
      headers: {
        ...(headerAuth !== undefined ? { Authorization: headerAuth } : {}),
      },
      query: {
        userId: profile.id,
        beforeISODateStr: tomorrow().toISOString(), // Use a "future" date to ensure most recent posts are also fetched
        size: POSTS_IN_VIEW_CT,
      },
    });
    if (!fetchResult.success) {
      logger.error(fetchResult.error);
      setPostsStatus("error");
      return;
    }
    const { data } = fetchResult.value;

    setPostsStatus("ok");
    setPosts(data);
  }, [profile]);
  useEffect(() => {
    logger.debug("Initializing posts...");
    initializePosts();
  }, [initializePosts]);

  const [hasNextPosts, setHasNextPosts] = useState(true);
  const extendPosts = useCallback(
    async (ctl: Controller) => {
      const lastPost = posts.at(-1);
      const date = lastPost?.timestamp ?? tomorrow(); // Use a "future" date to ensure most recent posts are also fetched

      if (!ctl.shouldProceed) return;
      const headerAuthResult = safe(() => getFromStorage("SESS"));
      const headerAuth = headerAuthResult.success
        ? headerAuthResult.value
        : undefined;

      if (!ctl.shouldProceed) return;
      const nextPostsResult = await fetchAPI("/api/v0/posts", "GET", {
        headers: {
          ...(headerAuth !== undefined ? { Authorization: headerAuth } : {}),
        },
        query: {
          userId: profile.id,
          beforeISODateStr: date.toISOString(),
          size: POSTS_IN_VIEW_CT + 1, // Fetch 1 additional to "check" if there is still more next
        },
      });
      if (!nextPostsResult.success) {
        logger.error(nextPostsResult.error);
        setPostsStatus("error");
        return;
      }
      const nextPosts = nextPostsResult.value.data;

      const hasExtraPost = nextPosts.length > POSTS_IN_VIEW_CT;
      const extension = !hasExtraPost ? nextPosts : nextPosts.slice(0, -1);

      if (!ctl.shouldProceed) return;
      if (!hasExtraPost) setHasNextPosts(false);
      setPosts([...posts, ...extension]);
    },
    [profile, posts],
  );

  const extendPostsWithRecent = useCallback(async () => {
    const headerAuthResult = safe(() => getFromStorage("SESS"));
    const headerAuth = headerAuthResult.success
      ? headerAuthResult.value
      : undefined;

    const recentPostsResult = await fetchAPI("/api/v0/posts", "GET", {
      headers: {
        ...(headerAuth !== undefined ? { Authorization: headerAuth } : {}),
      },
      query: {
        userId: profile.id,
        beforeISODateStr: tomorrow().toISOString(),
        size: POSTS_IN_VIEW_CT, // TODO Is this enough? Too much?
      },
    });
    if (!recentPostsResult.success) {
      logger.error(recentPostsResult.error);
      setPostsStatus("error");
      return;
    }
    const recentPosts = recentPostsResult.value.data;

    const postIds = new Set<PostWithAuthor["id"]>();
    const newPostsWithPossibleRepeats = [...recentPosts, ...posts]; // TODO Only check at the end of recent posts and start of current?
    const newPosts = newPostsWithPossibleRepeats.filter((post) => {
      if (postIds.has(post.id)) return false; // Remove post if it is already "seen"
      postIds.add(post.id); // Mark post as "seen"
      return true; // Keep post
    });
    setPosts(newPosts);
  }, [profile, posts]);

  /** Possible to be de-synced with database... */
  const removePostFromState = useCallback(
    (post: PostWithAuthor) => {
      const deletedPostId = post.id;
      const newPosts = posts.filter((post) => post.id !== deletedPostId);
      setPosts(newPosts);
    },
    [posts],
  );

  return {
    postsStatus,
    ...{ posts, initializePosts },
    ...{ hasNextPosts, extendPosts, extendPostsWithRecent },
    removePostFromState,
  };
});
