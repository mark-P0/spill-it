import { PostWithAuthor } from "@spill-it/db/schema";
import { safe } from "@spill-it/utils/safe";
import { addDays } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../../utils/fetch-api";
import { createNewContext } from "../../utils/react";
import { getFromStorage } from "../../utils/storage";

// TODO Move date functions to common file?
const today = () => new Date();
const tomorrow = () => addDays(today(), 1);
const POSTS_IN_VIEW_CT = 8;

export const [useHomeContext, HomeProvider] = createNewContext(() => {
  const [postsStatus, setPostsStatus] = useState<"fetching" | "error" | "ok">(
    "fetching",
  );
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
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
  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null);

  return {
    postsStatus,
    ...{ posts, refreshPosts },
    ...{ postToDelete, setPostToDelete },
  };
});
