import { eq, sql } from "drizzle-orm";
import { localizeLogger } from "../utils/logger";
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
  try {
    const users = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.id, id))
      .limit(1);
    const user = users[0] ?? null;
    return user;
  } catch {
    logger.error(`Failed getting user details of ID ${id}`);
    return null;
  }
}

export async function readGoogleUser(googleId: string): Promise<User | null> {
  try {
    const users = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.googleId, googleId))
      .limit(1);
    const user = users[0] ?? null;
    return user;
  } catch {
    logger.error(`Failed getting user details of Google ID ${googleId}`);
    return null;
  }
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
  if (await isGoogleUserExisting(googleId)) {
    throw new Error(`User of Google ID ${googleId} already exists`);
  }

  let user: User | undefined; // TODO Extract into function?
  try {
    const username = createUsernameFromHandle(handleName);
    const users = await db
      .insert(UsersTable)
      .values({ username, handleName, portraitUrl, googleId, loginCt: 0 })
      .returning();
    user = users[0];
  } catch {
    throw new Error(`Failed creating user from Google ID ${googleId}`);
  }
  if (user === undefined) {
    throw new Error("Inserted user does not exist...?");
  }

  return user;
}

/**
 * Update count "in-place" using current value
 * - https://en.wikipedia.org/wiki/Update_(SQL)#Examples
 * - https://discord.com/channels/1043890932593987624/1176593045840482394
 * - https://discord.com/channels/1043890932593987624/1176256065684385922
 */
export async function updateIncrementGoogleUserLoginCt(googleId: string) {
  if (!(await isGoogleUserExisting(googleId))) {
    throw new Error(`User of Google ID ${googleId} does not exist!`);
  }

  try {
    await db
      .update(UsersTable)
      .set({ loginCt: sql`${UsersTable.loginCt} + 1` })
      .where(eq(UsersTable.googleId, googleId));
  } catch {
    logger.error(`Failed incrementing login count of Google ID ${googleId}`);
  }
}

export async function readGoogleUserSessionId(
  googleId: string
): Promise<string | null> {
  const details = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.googleId, googleId),
    with: {
      session: true,
    },
  });
  if (details === undefined) return null;
}
