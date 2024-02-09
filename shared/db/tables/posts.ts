import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "../db";
import { Post, PostDetails, PostWithAuthor, PostsTable } from "../schema";
import { POST_CT_CAP } from "../utils/constants";

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

export async function readPostsOfUser(
  userId: PostWithAuthor["userId"],
): Promise<PostWithAuthor[]> {
  const result = await safeAsync(() =>
    db.query.PostsTable.findMany({
      where: eq(PostsTable.userId, userId),
      orderBy: desc(PostsTable.timestamp),
      with: { author: true },
    }),
  );
  const posts = result.success
    ? result.value
    : raise("Failed reading posts of user", result.error);

  return posts;
}

export async function readPostsOfUserBeforeTimestamp(
  userId: PostWithAuthor["userId"],
  timestamp: PostWithAuthor["timestamp"],
  ct: number,
): Promise<PostWithAuthor[]> {
  if (ct > POST_CT_CAP) raise("Requested post count greater than set cap");

  const result = await safeAsync(() =>
    db.query.PostsTable.findMany({
      where: and(
        eq(PostsTable.userId, userId), // Posts of user
        lt(PostsTable.timestamp, timestamp), // Before a particular time
      ),
      limit: ct, // Limited to a specific count
      orderBy: desc(PostsTable.timestamp), // Sorted from most to least recent
      with: { author: true },
    }),
  );
  const posts = result.success
    ? result.value
    : raise("Failed reading posts of user", result.error);

  return posts;
}

// (async () => {
//   const userId = "da2e85d7-5124-4273-9968-89b50ba4b9d4";
//   const size = 3;
//   let date = new Date();
//
//   for (let _ = 0; _ < 3; _++) {
//     const posts = await db.query.PostsTable.findMany({
//       columns: {
//         content: true,
//         timestamp: true,
//       },
//       where: and(
//         //
//         eq(PostsTable.userId, userId),
//         lt(PostsTable.timestamp, date),
//       ),
//       limit: size,
//       orderBy: desc(PostsTable.timestamp),
//       // with: { author: true },
//     });
//
//     console.log({ date, posts });
//
//     const lastPost = posts.at(-1) ?? raise("Last post does not exist...?");
//     date = lastPost.timestamp;
//   }
// })();

export async function deletePost(id: Post["id"]) {
  const result = await safeAsync(() =>
    db.delete(PostsTable).where(eq(PostsTable.id, id)),
  );
  if (!result.success) raise("Failed deleting post", result.error);
}
