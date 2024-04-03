import { POSTS_CT_MAX_UI } from "@spill-it/constraints";
import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { tomorrow } from "@spill-it/utils/dates";
import { safe } from "@spill-it/utils/safe";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../../../utils/fetch-api";
import { logger } from "../../../utils/logger";
import { Controller, createNewContext } from "../../../utils/react";
import { getFromStorage } from "../../../utils/storage";

type FeedStatus = "fetching" | "error" | "ok";
export const [useFeedContext, FeedProvider] = createNewContext(() => {
  const [feedStatus, setFeedStatus] = useState<FeedStatus>("fetching");

  const [feed, setFeed] = useState<PostWithAuthor[]>([]);
  const initializeFeed = useCallback(async () => {
    setFeedStatus("fetching");

    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      logger.error(headerAuthResult.error);
      setFeedStatus("error");
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts/feed", "GET", {
      headers: { Authorization: headerAuth },
      query: {
        beforeISODateStr: tomorrow().toISOString(), // Use a "future" date to ensure most recent posts are also fetched
        size: POSTS_CT_MAX_UI,
      },
    });
    if (!fetchResult.success) {
      logger.error(fetchResult.error);
      setFeedStatus("error");
      return;
    }
    const { data } = fetchResult.value;

    setFeedStatus("ok");
    setFeed(data);
  }, []);
  useEffect(() => {
    initializeFeed();
  }, [initializeFeed]);

  const [hasNextPosts, setHasNextPosts] = useState(true);
  const extendFeed = useCallback(
    async (ctl: Controller) => {
      const lastPost = feed.at(-1);
      const date = lastPost?.timestamp ?? tomorrow(); // Use a "future" date to ensure most recent posts are also fetched

      if (!ctl.shouldProceed) return;
      const headerAuthResult = safe(() => getFromStorage("SESS"));
      if (!headerAuthResult.success) {
        logger.error(headerAuthResult.error);
        setFeedStatus("error");
        return;
      }
      const headerAuth = headerAuthResult.value;

      if (!ctl.shouldProceed) return;
      const nextPostsResult = await fetchAPI("/api/v0/posts/feed", "GET", {
        headers: { Authorization: headerAuth },
        query: {
          beforeISODateStr: date.toISOString(),
          size: POSTS_CT_MAX_UI + 1, // Fetch 1 additional to "check" if there is still more next
        },
      });
      if (!nextPostsResult.success) {
        logger.error(nextPostsResult.error);
        setFeedStatus("error");
        return;
      }
      const nextPosts = nextPostsResult.value.data;

      const hasExtraPost = nextPosts.length > POSTS_CT_MAX_UI;
      const extension = !hasExtraPost ? nextPosts : nextPosts.slice(0, -1);

      if (!ctl.shouldProceed) return;
      if (!hasExtraPost) setHasNextPosts(false);
      setFeed([...feed, ...extension]);
    },
    [feed],
  );

  const extendFeedWithRecent = useCallback(async () => {
    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      logger.error(headerAuthResult.error);
      setFeedStatus("error");
      return;
    }
    const headerAuth = headerAuthResult.value;

    const recentPostsResult = await fetchAPI("/api/v0/posts/feed", "GET", {
      headers: { Authorization: headerAuth },
      query: {
        beforeISODateStr: tomorrow().toISOString(),
        size: POSTS_CT_MAX_UI, // TODO Is this enough? Too much?
      },
    });
    if (!recentPostsResult.success) {
      logger.error(recentPostsResult.error);
      setFeedStatus("error");
      return;
    }
    const recentPosts = recentPostsResult.value.data;

    const postIds = new Set<PostWithAuthor["id"]>();
    const newPostsWithPossibleRepeats = [...recentPosts, ...feed]; // TODO Only check at the end of recent posts and start of current?
    const newPosts = newPostsWithPossibleRepeats.filter((post) => {
      if (postIds.has(post.id)) return false; // Remove post if it is already "seen"
      postIds.add(post.id); // Mark post as "seen"
      return true; // Keep post
    });
    setFeed(newPosts);
  }, [feed]);

  /** Possible to be de-synced with database... */
  const removePostFromState = useCallback(
    (post: PostWithAuthor) => {
      const deletedPostId = post.id;
      const newFeed = feed.filter((post) => post.id !== deletedPostId);
      setFeed(newFeed);
    },
    [feed],
  );

  return {
    feedStatus,
    ...{ feed, initializeFeed },
    ...{ hasNextPosts, extendFeed, extendFeedWithRecent },
    removePostFromState,
  };
});
