import { raise } from "@spill-it/utils/errors";
import { randomInteger } from "@spill-it/utils/random";
import { safeAsync } from "@spill-it/utils/safe";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { User, UsersTable } from "../schema/drizzle";

export async function isGoogleUserExisting(googleId: string): Promise<boolean> {
  const user = await readUserViaGoogleId(googleId);
  return user !== null;
}

export async function readUser(id: User["id"]): Promise<User | null> {
  const result = await safeAsync(
    () => db.select().from(UsersTable).where(eq(UsersTable.id, id)).limit(2), // There should only be at most 1. If there are 2 (or more), something has gone wrong...
  );
  const users = result.success
    ? result.value
    : raise("Failed reading user from ID", result.error);

  if (users.length > 1) raise("Multiple users for an ID...?");
  const user = users[0] ?? null;

  return user;
}

export async function readUserViaGoogleId(
  googleId: NonNullable<User["googleId"]>,
): Promise<User | null> {
  const result = await safeAsync(() =>
    db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.googleId, googleId))
      .limit(2),
  );
  const users = result.success
    ? result.value
    : raise("Failed reading user from Google ID", result.error);

  if (users.length > 1) raise("Multiple users for an Google ID...?");
  const user = users[0] ?? null;

  return user;
}

export async function readUserViaUsername(
  username: User["username"],
): Promise<User | null> {
  const result = await safeAsync(() =>
    db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.username, username))
      .limit(2),
  );
  const users = result.success
    ? result.value
    : raise("Failed reading user with username", result.error);

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
  const result = await safeAsync(() =>
    db
      .insert(UsersTable)
      .values({ username, handleName, portraitUrl, googleId, loginCt: 0 })
      .returning(),
  );
  const users = result.success
    ? result.value
    : raise("Failed creating user from Google ID", result.error);

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

  const result = await safeAsync(() =>
    db
      .update(UsersTable)
      .set({ loginCt: sql`${UsersTable.loginCt} + 1` })
      .where(eq(UsersTable.googleId, googleId)),
  );
  if (!result.success)
    raise("Failed incrementing user login count from Google ID", result.error);
}
