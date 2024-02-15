import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  Follow,
  FollowDetails,
  FollowWithUsers,
  FollowsTable,
} from "../schema/drizzle";

export async function createFollow(
  details: FollowDetails,
): Promise<FollowWithUsers> {
  return await db.transaction(async (tx) => {
    const insertedFollows = await tx
      .insert(FollowsTable)
      .values(details)
      .returning();
    if (insertedFollows.length > 1) {
      await tx.rollback(); // Not a promise? Awaited in docs...
      raise("Multiple follow entries created...?");
    }
    const insertedFollow = insertedFollows[0];
    if (insertedFollow === undefined) {
      await tx.rollback();
      raise("Inserted follow entry does not exist...?");
    }

    const follows = await tx.query.FollowsTable.findMany({
      limit: 2,
      where: eq(FollowsTable.id, insertedFollow.id),
      with: {
        follower: true,
        following: true,
      },
    });
    if (follows.length > 1) {
      await tx.rollback();
      raise("Multiple follow entries created...?");
    }
    const follow = follows[0];
    if (follow === undefined) {
      await tx.rollback();
      raise("Inserted follow entry does not exist...?");
    }

    return follow;
  });
}

export async function readFollowBetweenUsers(
  followerUserId: Follow["followerUserId"],
  followingUserId: Follow["followingUserId"],
): Promise<Follow | null> {
  const result = await safeAsync(() =>
    db
      .select()
      .from(FollowsTable)
      .where(
        and(
          eq(FollowsTable.followerUserId, followerUserId),
          eq(FollowsTable.followingUserId, followingUserId),
        ),
      )
      .limit(2),
  );
  const follows = result.success
    ? result.value
    : raise("Failed reading follow entries", result.error);

  if (follows.length > 1) raise("Multiple follow entries between users...?");
  const follow = follows[0] ?? null;

  return follow;
}
