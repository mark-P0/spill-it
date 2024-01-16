import { eq, sql } from "drizzle-orm";
import { raise } from "../utils/errors";
import { localizeLogger } from "../utils/logger";
import { safeAsync } from "../utils/try-catch";
import { db } from "./db";
import { UsersTable } from "./schema";

const logger = localizeLogger(import.meta.url);

function createUsernameFromHandle(handleName: string) {
  const tentativeHandle = handleName.toLowerCase().split(/\s/g).join("-"); // TODO Ensure unique from existing database entries!
  return tentativeHandle;
}

export type User = typeof UsersTable.$inferSelect;
type UserDetails = typeof UsersTable.$inferInsert;

export async function readUser(id: User["id"]): Promise<User | null> {
  const result = await safeAsync(
    () => db.select().from(UsersTable).where(eq(UsersTable.id, id)).limit(2) // There should only be at most 1. If there are 2 (or more), something has gone wrong...
  );
  const users = result.success
    ? result.value
    : raise(`Failed getting user details of ID ${id}`, result.error);

  if (users.length > 1) raise("Multiple users for an ID...?");
  const user = users[0] ?? null;

  return user;
}

export async function readGoogleUser(googleId: string): Promise<User | null> {
  const result = await safeAsync(() =>
    db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.googleId, googleId))
      .limit(2)
  );
  const users = result.success
    ? result.value
    : raise(
        `Failed getting user details of Google ID ${googleId}`,
        result.error
      );

  if (users.length > 1) raise("Multiple users for an Google ID...?");
  const user = users[0] ?? null;

  return user;
}

export async function isGoogleUserExisting(googleId: string): Promise<boolean> {
  const user = await readGoogleUser(googleId);
  return user !== null;
}

export async function createUserFromGoogle(
  googleId: string,
  handleName: string,
  portraitUrl: string
): Promise<User> {
  if (await isGoogleUserExisting(googleId))
    raise(`User of Google ID ${googleId} already exists`);

  const username = createUsernameFromHandle(handleName);
  const result = await safeAsync(() =>
    db
      .insert(UsersTable)
      .values({ username, handleName, portraitUrl, googleId, loginCt: 0 })
      .returning()
  );
  const users = result.success
    ? result.value
    : raise(`Failed creating user from Google ID ${googleId}`, result.error);

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
    raise(`User of Google ID ${googleId} does not exist!`);

  const result = await safeAsync(() =>
    db
      .update(UsersTable)
      .set({ loginCt: sql`${UsersTable.loginCt} + 1` })
      .where(eq(UsersTable.googleId, googleId))
  );
  if (!result.success)
    raise(
      `Failed incrementing login count of Google ID ${googleId}`,
      result.error
    );
}
