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
import { POST_CT_CAP } from "../utils/constants";

(async () => {
  await db.transaction(async (tx) => {
    // RQB: {
    //   const followingUserIds = tx.query.FollowsTable.findMany({
    //     columns: { followerUserId: true },
    //     where: eq(FollowsTable.followerUserId, userId),
    //   });
    //   // console.log(followingUserIds);
    //
    //   const feed = await tx
    //     .select()
    //     .from(PostsTable)
    //     .where(inArray(PostsTable.userId, followingUserIds));
    //   console.log(feed);
    // }

    SQImplied: {
      const followingUserIds = tx
        .select({ _: FollowsTable.followingUserId })
        .from(FollowsTable)
        .where(eq(FollowsTable.followerUserId, userId));
      // console.log(followingUserIds);

      const feed = await tx.query.PostsTable.findMany({
        columns: { content: true },
        where: or(
          inArray(PostsTable.userId, followingUserIds),
          eq(PostsTable.userId, userId),
        ),
        limit: 8,
        orderBy: desc(PostsTable.timestamp),
      });
      console.log(feed);
    }

    //     SQ: {
    //       const sqFollowingUserIds = tx
    //         .select({ _: FollowsTable.followingUserId })
    //         .from(FollowsTable)
    //         .where(eq(FollowsTable.followerUserId, userId))
    //         .as("followings");
    //       // console.log(followingUserIds);
    //
    //       const feed = await tx
    //         .select()
    //         .from(PostsTable)
    //         .where(inArray(PostsTable.userId, sqFollowingUserIds));
    //       console.log(feed);
    //     }

    //     Join: {
    //       const sqFollowingUserIds = tx
    //         .select()
    //         .from(FollowsTable)
    //         .where(eq(FollowsTable.followerUserId, userId))
    //         .as("followings");
    //
    //       const feed = await tx
    //         .select({ content: PostsTable.content })
    //         .from(PostsTable)
    //         .innerJoin(
    //           sqFollowingUserIds,
    //           // eq(PostsTable.userId, sqFollowingUserIds.followingUserId),
    //           or(
    //             eq(PostsTable.userId, sqFollowingUserIds.followingUserId),
    //             eq(PostsTable.userId, userId),
    //           ),
    //         )
    //         .orderBy(desc(PostsTable.timestamp))
    //         .limit(8);
    //       console.log(feed);
    //     }

    // const followingUserIds = await tx
    //   .select()
    //   .from(FollowsTable)
    //   .where(eq(FollowsTable.followerUserId, userId));
    // console.log(followingUserIds);
    // const sqUserFollowings = tx
    //   .select()
    //   .from(FollowsTable)
    //   .where(eq(FollowsTable.followerUserId, userId))
    //   .as("followings");
    //     const feed = await tx
    //       .select()
    //       .from(PostsTable)
    //       // .where(eq(PostsTable.userId, sqUserFollowings.followingUserId));
    //     console.log(feed);
    // const feed = await tx
    //   .select()
    //   .from(PostsTable)
    //   .innerJoin(
    //     sqUserFollowings,
    //     eq(PostsTable.userId, sqUserFollowings.followingUserId),
    //   );
    // console.log(feed);
  });
})();

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

export async function deletePost(id: Post["id"]) {
  await db.delete(PostsTable).where(eq(PostsTable.id, id));
}
