import { POST_CT_CAP } from "@spill-it/constraints";
import { raise } from "@spill-it/utils/errors";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "../db";
import {
  FollowsTable,
  Post,
  PostDetails,
  PostWithAuthor,
  PostsTable,
} from "../schema/drizzle";

export async function createPost(details: PostDetails): Promise<Post> {
  const posts = await db.insert(PostsTable).values(details).returning();

  if (posts.length > 1) raise("Multiple posts inserted...?");
  const post = posts[0] ?? raise("Inserted post does not exist...?");

  return post;
}

export async function readPost(id: Post["id"]): Promise<Post | null> {
  const posts = await db
    .select()
    .from(PostsTable)
    .where(eq(PostsTable.id, id))
    .limit(2); // There should only be at most 1. If there are 2 (or more), something has gone wrong...

  if (posts.length > 1) raise("Multiple posts for an ID...?");
  const post = posts[0] ?? null;

  return post;
}

export async function readPostsWithAuthorViaUser(
  userId: PostWithAuthor["userId"],
): Promise<PostWithAuthor[]> {
  const posts = await db.query.PostsTable.findMany({
    where: eq(PostsTable.userId, userId),
    orderBy: desc(PostsTable.timestamp),
    with: { author: true },
  });

  return posts;
}

export async function readPostsWithAuthorViaUserBeforeTimestamp(
  userId: PostWithAuthor["userId"],
  timestamp: PostWithAuthor["timestamp"],
  ct: number,
): Promise<PostWithAuthor[]> {
  if (ct > POST_CT_CAP) raise("Requested post count greater than set cap");

  const posts = await db.query.PostsTable.findMany({
    where: and(
      eq(PostsTable.userId, userId), // Posts of user
      lt(PostsTable.timestamp, timestamp), // Before a particular time
    ),
    limit: ct, // Limited to a specific count
    orderBy: desc(PostsTable.timestamp), // Sorted from most to least recent
    with: { author: true },
  });

  return posts;
}

/** A user's feed is a list of their own posts and those that they follow */
export async function readPostsFeedWithAuthorViaUserBeforeTimestamp(
  userId: PostWithAuthor["userId"],
  timestamp: PostWithAuthor["timestamp"],
  ct: number,
): Promise<PostWithAuthor[]> {
  if (ct > POST_CT_CAP) raise("Requested post count greater than set cap");

  return await db.transaction(async (tx) => {
    /**
     * IDs of users that `userId` follows, as a "subquery".
     * Just like a regular select but without `await` (meaning it is not executed?)
     *
     * Seems to be different from (https://orm.drizzle.team/docs/select#select-from-subquery)
     * as it can be used in operators, e.g. `inArray()` as an "array" (as long as it only has 1 column(?))
     *
     * - https://github.com/drizzle-team/drizzle-orm/discussions/1152
     * - https://twitter.com/McPizza0/status/1701998866176921716
     */
    const sqFollowingUserIds = tx
      .select({ _: FollowsTable.followingUserId }) // Keep only a single column
      .from(FollowsTable)
      .where(
        and(
          eq(FollowsTable.followerUserId, userId), // Relationships where `userId` is the follower
          eq(FollowsTable.isAccepted, true), // Only consider accepted (i.e. actual) follows
        ),
      );

    const posts = await tx.query.PostsTable.findMany({
      where: and(
        or(
          inArray(PostsTable.userId, sqFollowingUserIds), // Posts of followed users, or
          eq(PostsTable.userId, userId), // Posts of user
        ),
        lt(PostsTable.timestamp, timestamp), // Before a particular time
      ),
      limit: ct, // Limited to a specific count
      orderBy: desc(PostsTable.timestamp), // Sorted from most to least recent
      with: { author: true },
    });

    return posts;
  });
}

export async function deletePost(id: Post["id"]) {
  await db.delete(PostsTable).where(eq(PostsTable.id, id));
}
