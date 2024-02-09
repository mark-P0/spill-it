import { PostWithAuthor } from "@spill-it/db/schema";
import { safe } from "@spill-it/utils/safe";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../../utils/fetch-api";
import { createNewContext } from "../../utils/react";
import { getFromStorage } from "../../utils/storage";

const today = () => new Date();
const POSTS_IN_VIEW_CT = 8;

export const [useHomeContext, HomeProvider] = createNewContext(() => {
  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null);

  const [postsStatus, setPostsStatus] = useState<"fetching" | "error" | "ok">(
    "fetching",
  );
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  // const extendPosts =useCallback(async() => {}, [])

  const refreshPosts = useCallback(async () => {
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
        fromISODateStr: today().toISOString(),
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
    setPostsStatus("fetching");
    refreshPosts();
  }, [refreshPosts]);

  return {
    postsStatus,
    ...{ posts, refreshPosts },
    ...{ postToDelete, setPostToDelete },
  };
});
