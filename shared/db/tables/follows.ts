import { raise } from "@spill-it/utils/errors";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  Follow,
  FollowDetails,
  FollowWithUsers,
  FollowsTable,
} from "../schema/drizzle";
import { Follower, Following } from "../schema/zod";

export async function readFollowBetweenUsers(
  followerUserId: Follow["followerUserId"],
  followingUserId: Follow["followingUserId"],
): Promise<Follow | null> {
  const follows = await db
    .select()
    .from(FollowsTable)
    .where(
      and(
        eq(FollowsTable.followerUserId, followerUserId),
        eq(FollowsTable.followingUserId, followingUserId),
      ),
    )
    .limit(2);

  if (follows.length > 1) raise("Multiple follow entries between users...?");
  const follow = follows[0] ?? null;

  return follow;
}

export async function readFollowers(
  followingUserId: Follow["followingUserId"],
): Promise<Follower[]> {
  const followers = await db.query.FollowsTable.findMany({
    where: eq(FollowsTable.followingUserId, followingUserId),
    columns: { date: true, isAccepted: true },
    with: { follower: true },
  });

  return followers;
}
export async function readFollowings(
  followerUserId: Follow["followerUserId"],
): Promise<Following[]> {
  const followings = await db.query.FollowsTable.findMany({
    where: eq(FollowsTable.followerUserId, followerUserId),
    columns: { date: true, isAccepted: true },
    with: { following: true },
  });

  return followings;
}

export async function updateFollow(
  id: Follow["id"],
  details: Partial<Omit<FollowDetails, "id">>,
): Promise<Follow> {
  return await db.transaction(async (tx) => {
    const follows = await tx
      .update(FollowsTable)
      .set(details)
      .where(eq(FollowsTable.id, id))
      .returning();

    if (follows.length > 1) raise("Multiple follow entries updated...?");
    const follow =
      follows[0] ?? raise("Updated follow entry does not exist...?");

    return follow;
  });
}

/**
 * Transactions are automatically rolled back upon errors (think try-catch)
 * - https://github.com/drizzle-team/drizzle-orm/issues/1450
 * - https://discord.com/channels/1043890932593987624/1164552839369072711
 *
 * In fact, all that `tx.rollback()` does is throw an error and it not awaitable, unlike what the docs says
 * - https://discord.com/channels/1043890932593987624/1164552839369072711
 */
export async function createFollow(
  details: FollowDetails,
): Promise<FollowWithUsers> {
  return await db.transaction(async (tx) => {
    const insertedFollows = await tx
      .insert(FollowsTable)
      .values(details)
      .returning();
    if (insertedFollows.length > 1)
      raise("Multiple follow entries created...?");
    const insertedFollow =
      insertedFollows[0] ?? raise("Inserted follow entry does not exist...?");

    const follows = await tx.query.FollowsTable.findMany({
      limit: 2,
      where: eq(FollowsTable.id, insertedFollow.id),
      with: {
        follower: true,
        following: true,
      },
    });
    if (follows.length > 1) raise("Multiple follow entries created...?");
    const follow =
      follows[0] ?? raise("Inserted follow entry does not exist...?");

    return follow;
  });
}

export async function deleteFollowBetweenUsers(
  followerUserId: Follow["followerUserId"],
  followingUserId: Follow["followingUserId"],
): Promise<Follow> {
  return await db.transaction(async (tx) => {
    const follows = await tx
      .delete(FollowsTable)
      .where(
        and(
          eq(FollowsTable.followerUserId, followerUserId),
          eq(FollowsTable.followingUserId, followingUserId),
        ),
      )
      .returning();

    if (follows.length > 1) raise("Multiple follow entries between users...?");
    const follow =
      follows[0] ?? raise("Deleted follow entry does not exist...?");

    return follow;
  });
}
