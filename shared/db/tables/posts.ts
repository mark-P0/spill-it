import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { eq } from "drizzle-orm";
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

export async function readPost(id: Post["id"]): Promise<Post | null> {
  const result = await safeAsync(
    () => db.select().from(PostsTable).where(eq(PostsTable.id, id)).limit(2), // There should only be at most 1. If there are 2 (or more), something has gone wrong...
  );
  const posts = result.success
    ? result.value
    : raise("Failed reading post from ID", result.error);

  if (posts.length > 1) raise("Multiple posts for an ID...?");
  const post = posts[0] ?? null;

  return post;
}
