import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { tomorrow } from "@spill-it/utils/dates";
import { safe } from "@spill-it/utils/safe";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../../../utils/fetch-api";
import { Controller, createNewContext } from "../../../utils/react";
import { getFromStorage } from "../../../utils/storage";

const POSTS_IN_VIEW_CT = 8;

type PostStatus = "fetching" | "error" | "ok";
export const [usePostsContext, PostsProvider] = createNewContext(() => {
  const [postsStatus, setPostsStatus] = useState<PostStatus>("fetching");

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const initializePosts = useCallback(async () => {
    setPostsStatus("fetching");

    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      setPostsStatus("error");
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts", "GET", {
      headers: { Authorization: headerAuth },
      query: {
        beforeISODateStr: tomorrow().toISOString(), // Use a "future" date to ensure most recent posts are also fetched
        size: POSTS_IN_VIEW_CT,
      },
    });
    if (!fetchResult.success) {
      console.error(fetchResult.error);
      setPostsStatus("error");
      return;
    }
    const { data } = fetchResult.value;

    setPostsStatus("ok");
    setPosts(data);
  }, []);
  useEffect(() => {
    initializePosts();
  }, [initializePosts]);

  const [hasNextPosts, setHasNextPosts] = useState(true);
  const extendPosts = useCallback(
    async (ctl: Controller) => {
      const lastPost = posts.at(-1);
      const date = lastPost?.timestamp ?? tomorrow(); // Use a "future" date to ensure most recent posts are also fetched

      if (!ctl.shouldProceed) return;
      const headerAuthResult = safe(() => getFromStorage("SESS"));
      if (!headerAuthResult.success) {
        console.error(headerAuthResult.error);
        setPostsStatus("error");
        return;
      }
      const headerAuth = headerAuthResult.value;

      if (!ctl.shouldProceed) return;
      const nextPostsResult = await fetchAPI("/api/v0/posts", "GET", {
        headers: { Authorization: headerAuth },
        query: {
          beforeISODateStr: date.toISOString(),
          size: POSTS_IN_VIEW_CT + 1, // Fetch 1 additional to "check" if there is still more next
        },
      });
      if (!nextPostsResult.success) {
        console.error(nextPostsResult.error);
        setPostsStatus("error");
        return;
      }
      const nextPosts = nextPostsResult.value.data;

      if (!ctl.shouldProceed) return;
      setPosts([...posts, ...nextPosts.slice(0, -1)]);
      if (nextPosts.length < POSTS_IN_VIEW_CT) setHasNextPosts(false);
    },
    [posts],
  );

  const extendPostsWithRecent = useCallback(async () => {
    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      setPostsStatus("error");
      return;
    }
    const headerAuth = headerAuthResult.value;

    const recentPostsResult = await fetchAPI("/api/v0/posts", "GET", {
      headers: { Authorization: headerAuth },
      query: {
        beforeISODateStr: tomorrow().toISOString(),
        size: POSTS_IN_VIEW_CT, // TODO Is this enough? Too much?
      },
    });
    if (!recentPostsResult.success) {
      console.error(recentPostsResult.error);
      setPostsStatus("error");
      return;
    }
    const recentPosts = recentPostsResult.value.data;

    const postIds = new Set<PostWithAuthor["id"]>();
    const newPostsWithPossibleRepeats = [...recentPosts, ...posts]; // TODO Only check at the end of recents and start of current?
    const newPosts = newPostsWithPossibleRepeats.filter((post) => {
      if (postIds.has(post.id)) return false; // Remove post if it is already "seen"
      postIds.add(post.id); // Mark post as "seen"
      return true; // Keep post
    });
    setPosts(newPosts);
  }, [posts]);

  const deletePost = useCallback(
    async (post: PostWithAuthor) => {
      const headerAuthResult = safe(() => getFromStorage("SESS"));
      if (!headerAuthResult.success) {
        throw headerAuthResult.error;
      }
      const headerAuth = headerAuthResult.value;

      const fetchResult = await fetchAPI("/api/v0/posts", "DELETE", {
        headers: { Authorization: headerAuth },
        query: {
          id: post.id,
        },
      });
      /** Only proceed if the DELETE above succeeds... */
      if (!fetchResult.success) {
        throw fetchResult.error;
      }

      const deletedPostId = post.id;
      const newPosts = posts.filter((post) => post.id !== deletedPostId); // Possible to be de-synced with database...
      setPosts(newPosts);
    },
    [posts],
  );

  return {
    postsStatus,
    ...{ posts, initializePosts },
    ...{ hasNextPosts, extendPosts, extendPostsWithRecent, deletePost },
  };
});
