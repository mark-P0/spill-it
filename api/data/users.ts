import { eq } from "drizzle-orm";
import { db } from "./db";
import { UsersTable } from "./schema";

function createUsernameFromHandle(handleName: string) {
  const tentativeHandle = handleName.toLowerCase().split(/\s/g).join("-"); // TODO Ensure unique from existing database entries!
  return tentativeHandle;
}

export type User = typeof UsersTable.$inferSelect;
type UserDetails = typeof UsersTable.$inferInsert;

export async function getUser(id: User["id"]): Promise<User | null> {
  try {
    const users = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.id, id))
      .limit(1);
    const user = users[0] ?? null;
    return user;
  } catch {
    console.error(`Failed getting user details of ID ${id}`);
    return null;
  }
}

export async function getGoogleUser(googleId: string): Promise<User | null> {
  try {
    const users = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.googleId, googleId))
      .limit(1);
    const user = users[0] ?? null;
    return user;
  } catch {
    console.error(`Failed getting user details of Google ID ${googleId}`);
    return null;
  }
}

export async function isGoogleUserExisting(googleId: string): Promise<boolean> {
  const user = await getGoogleUser(googleId);
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
      .values({ username, handleName, portraitUrl, googleId })
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
