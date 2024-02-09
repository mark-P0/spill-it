import { PostWithAuthor } from "@spill-it/db/schema";
import { safe } from "@spill-it/utils/safe";
import { addDays } from "date-fns";
import { useCallback, useState } from "react";
import { fetchAPI } from "../../utils/fetch-api";
import { createNewContext } from "../../utils/react";
import { getFromStorage } from "../../utils/storage";
import { Controller } from "./controller";

// TODO Move date functions to common file?
const today = () => new Date();
const tomorrow = () => addDays(today(), 1);
const POSTS_IN_VIEW_CT = 8;

export const [useHomeContext, HomeProvider] = createNewContext(() => {
  const [postsStatus, setPostsStatus] = useState<"fetching" | "error" | "ok">(
    "ok",
  );
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
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
  const refreshPosts = useCallback(async () => {
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

  // TODO Posts status also unnecessary?
  // TODO Unnecessary?
  // useEffect(() => {
  //   extendPosts();
  // }, []);

  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null);

  return {
    postsStatus,
    ...{ posts, refreshPosts, extendPosts, hasNextPosts },
    ...{ postToDelete, setPostToDelete },
  };
});
