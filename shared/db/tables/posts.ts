import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { db } from "../db";
import { PostsTable } from "../schema";

export type Post = typeof PostsTable.$inferSelect;
type PostDetails = typeof PostsTable.$inferInsert;

export async function createPost(details: PostDetails): Promise<Post> {
  const result = await safeAsync(() =>
    db.insert(PostsTable).values(details).returning(),
  );
  const posts = result.success
    ? result.value
    : raise("Failed creating post", result.error);

  if (posts.length > 1) raise("Multiple posts inserted...?");
  const post = posts[0] ?? raise("Inserted post does not exist...?");

  return post;
}
