import { raise } from "@spill-it/utils/errors";
import { randomInteger } from "@spill-it/utils/random";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { User, UsersTable } from "../schema/drizzle";
import { UserPublicWithFollows } from "../schema/zod";

export async function isGoogleUserExisting(googleId: string): Promise<boolean> {
  const user = await readUserViaGoogleId(googleId);
  return user !== null;
}

export async function readUser(id: User["id"]): Promise<User | null> {
  const users = await db
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.id, id))
    .limit(2); // There should only be at most 1. If there are 2 (or more), something has gone wrong...;

  if (users.length > 1) raise("Multiple users for an ID...?");
  const user = users[0] ?? null;

  return user;
}

export async function readUserViaGoogleId(
  googleId: NonNullable<User["googleId"]>,
): Promise<User | null> {
  const users = await db
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.googleId, googleId))
    .limit(2);

  if (users.length > 1) raise("Multiple users for an Google ID...?");
  const user = users[0] ?? null;

  return user;
}

export async function readUserViaUsername(
  username: User["username"],
): Promise<User | null> {
  const users = await db
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.username, username))
    .limit(2);

  if (users.length > 1) raise("Multiple users for a username...?");
  const user = users[0] ?? null;

  return user;
}

export async function readUserWithFollowsViaUsername(
  username: User["username"],
): Promise<UserPublicWithFollows | null> {
  const users = await db.query.UsersTable.findMany({
    limit: 2,
    where: eq(UsersTable.username, username),
    with: {
      followers: {
        columns: { date: true },
        with: { follower: true },
      },
      followings: {
        columns: { date: true },
        with: { following: true },
      },
    },
  });

  if (users.length > 1) raise("Multiple users for a username...?");
  const user = users[0] ?? null;

  return user;
}

async function createUsernameFromHandle(handleName: string, sep = "-") {
  let username = handleName.toLowerCase().replace(/\s/g, sep);

  const existingUser = await readUserViaUsername(username);
  if (existingUser === null) return username;

  username += sep + `${randomInteger(0, 9 + 1)}`;
  return createUsernameFromHandle(username, "");
}
export async function createUserFromGoogle(
  googleId: string,
  handleName: string,
  portraitUrl: string,
): Promise<User> {
  if (await isGoogleUserExisting(googleId))
    raise("Failed creating user from Google ID as they already exist");

  const username = await createUsernameFromHandle(handleName);
  const users = await db
    .insert(UsersTable)
    .values({ username, handleName, portraitUrl, googleId, loginCt: 0 })
    .returning();

  if (users.length > 1) raise("Multiple Google users inserted...?");
  const user = users[0] ?? raise("Inserted Google user does not exist...?");

  return user;
}

/**
 * Update count "in-place" using current value
 * - https://en.wikipedia.org/wiki/Update_(SQL)#Examples
 * - https://discord.com/channels/1043890932593987624/1176593045840482394
 * - https://discord.com/channels/1043890932593987624/1176256065684385922
 */
export async function updateIncrementGoogleUserLoginCt(googleId: string) {
  if (!(await isGoogleUserExisting(googleId)))
    raise(
      "Failed incrementing user login count from Google ID as they do not exist",
    );

  await db
    .update(UsersTable)
    .set({ loginCt: sql`${UsersTable.loginCt} + 1` })
    .where(eq(UsersTable.googleId, googleId));
}
