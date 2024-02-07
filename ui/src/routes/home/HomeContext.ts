import { PostWithAuthor } from "@spill-it/db/schema";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../../utils/fetch-api";
import { createNewContext } from "../../utils/react";

export const [useHomeContext, HomeProvider] = createNewContext(() => {
  const [posts, setPosts] = useState<PostWithAuthor[] | "fetching" | "error">(
    "fetching",
  );
  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null);

  const refreshPosts = useCallback(async () => {
    const headerAuth = localStorage.getItem("SESS");
    if (headerAuth === null) {
      console.error("Header auth does not exist...?");
      setPosts("error");
      return;
    }

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
