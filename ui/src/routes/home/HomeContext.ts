import { PostWithAuthor } from "@spill-it/db/schema";
import { safe } from "@spill-it/utils/safe";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../../utils/fetch-api";
import { createNewContext } from "../../utils/react";
import { getFromStorage } from "../../utils/storage";

const today = () => new Date(); // TODO Move date functions to common file?
const POSTS_IN_VIEW_CT = 8;

export const [useHomeContext, HomeProvider] = createNewContext(() => {
  const [posts, setPosts] = useState<PostWithAuthor[] | "fetching" | "error">(
    "fetching",
  );
  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null);

  const refreshPosts = useCallback(async () => {
    const headerAuthResult = safe(() => getFromStorage("SESS"));
    if (!headerAuthResult.success) {
      console.error(headerAuthResult.error);
      setPosts("error");
      return;
    }
    const headerAuth = headerAuthResult.value;

    const fetchResult = await fetchAPI("/api/v0/posts", "GET", {
      headers: { Authorization: headerAuth },
      query: {
        beforeISODateStr: today().toISOString(),
        size: POSTS_IN_VIEW_CT,
      },
    });
    if (!fetchResult.success) {
      console.error(fetchResult.error);
      setPosts("error");
      return;
    }
    const { data } = fetchResult.value;

    setPosts(data);
  }, []);

  useEffect(() => {
    setPosts("fetching");
    refreshPosts();
  }, [refreshPosts]);

  return {
    ...{ posts, refreshPosts },
    ...{ postToDelete, setPostToDelete },
  };
});
