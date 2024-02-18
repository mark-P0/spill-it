import { raise } from "@spill-it/utils/errors";
import { randomChoice } from "@spill-it/utils/random";
import { digits, letters } from "@spill-it/utils/strings";
import { eq, sql } from "drizzle-orm";
import { DBTransaction, db } from "../db";
import { User, UsersTable } from "../schema/drizzle";
import { UserPublicWithFollows } from "../schema/zod";

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

async function _readUserViaGoogleId(
  tx: DBTransaction,
  googleId: NonNullable<User["googleId"]>,
): Promise<User | null> {
  const users = await tx
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.googleId, googleId))
    .limit(2);

  if (users.length > 1) raise("Multiple users for an Google ID...?");
  const user = users[0] ?? null;

  return user;
}
export async function readUserViaGoogleId(
  googleId: NonNullable<User["googleId"]>,
): Promise<User | null> {
  return await db.transaction(async (tx) => {
    return await _readUserViaGoogleId(tx, googleId);
  });
}

async function _readUserViaUsername(
  tx: DBTransaction,
  username: User["username"],
): Promise<User | null> {
  const users = await tx
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.username, username))
    .limit(2);

  if (users.length > 1) raise("Multiple users for a username...?");
  const user = users[0] ?? null;

  return user;
}
export async function readUserViaUsername(
  username: User["username"],
): Promise<User | null> {
  return await db.transaction(async (tx) => {
    return await _readUserViaUsername(tx, username);
  });
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

const charset = new Set([...letters, ...digits]);
async function _buildUsernameFromHandle(
  tx: DBTransaction,
  handleName: string,
): Promise<string> {
  let username = handleName
    .toLowerCase()
    .split("")
    .filter((char) => charset.has(char))
    .join("");

  for (;;) {
    const existingUser = await _readUserViaUsername(tx, username);
    if (existingUser === null) break;
    username += randomChoice(digits);
  }

  return username;
}
export async function createUserFromGoogle(
  googleId: string,
  handleName: string,
  portraitUrl: string,
): Promise<User> {
  return await db.transaction(async (tx) => {
    const existingUser = await _readUserViaGoogleId(tx, googleId);
    if (existingUser !== null)
      raise("Google ID already associated with a user");

    const username = await _buildUsernameFromHandle(tx, handleName);
    const users = await tx
      .insert(UsersTable)
      .values({ username, handleName, portraitUrl, googleId, loginCt: 0 })
      .returning();

    if (users.length > 1) raise("Multiple Google users inserted...?");
    const user = users[0] ?? raise("Inserted Google user does not exist...?");

    return user;
  });
}

/**
 * Update count "in-place" using current value
 * - https://en.wikipedia.org/wiki/Update_(SQL)#Examples
 * - https://discord.com/channels/1043890932593987624/1176593045840482394
 * - https://discord.com/channels/1043890932593987624/1176256065684385922
 */
export async function updateIncrementGoogleUserLoginCt(
  googleId: string,
): Promise<User> {
  return await db.transaction(async (tx) => {
    const existingUser = await _readUserViaGoogleId(tx, googleId);
    if (existingUser === null)
      raise(
        "Failed incrementing user login count from Google ID as they do not exist",
      );

    const users = await tx
      .update(UsersTable)
      .set({ loginCt: sql`${UsersTable.loginCt} + 1` })
      .where(eq(UsersTable.googleId, googleId))
      .returning();

    if (users.length > 1) raise("Multiple Google users updated...?");
    const user = users[0] ?? raise("Updated Google user does not exist...?");

    return user;
  });
}
