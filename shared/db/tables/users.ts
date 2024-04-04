import {
  USERNAME_LEN_MAX,
  USERNAME_LEN_MIN,
  usernameCharset,
} from "@spill-it/constraints";
import { raise } from "@spill-it/utils/errors";
import { randomChoice } from "@spill-it/utils/random";
import { digits, letters } from "@spill-it/utils/strings";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { DBTransaction, db } from "../db";
import { User, UserDetails, UsersTable } from "../schema/drizzle";
import { UserPublicWithFollows } from "../schema/zod";
import { env } from "../utils/env";

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
        columns: { date: true, isAccepted: true },
        with: { follower: true },
      },
      followings: {
        columns: { date: true, isAccepted: true },
        with: { following: true },
      },
    },
  });

  if (users.length > 1) raise("Multiple users for a username...?");
  const user = users[0] ?? null;

  return user;
}

function buildUsernameBase(handleName: string): string {
  let base = handleName
    .toLowerCase()
    .split("")
    .filter((char) => usernameCharset.has(char))
    .join("");

  const missingCharCt = USERNAME_LEN_MIN - base.length;
  for (let _ = 0; _ < missingCharCt; _++) {
    base += randomChoice(digits); // Pad base username until it reaches minimum length
  }
  base = base.slice(0, USERNAME_LEN_MAX - 3); // Allot spaces at the end for random suffix

  return base;
}
async function _buildUsernameFromHandle(
  tx: DBTransaction,
  handleName: string,
  maxRetries = 8,
): Promise<string> {
  const base = buildUsernameBase(handleName);

  let username = base;
  for (let _ = 0; _ < maxRetries; _++) {
    const existingUser = await _readUserViaUsername(tx, username);
    if (existingUser === null) return username;

    if (username.length === USERNAME_LEN_MAX) username = base; // Restart the process when max length has been reached and username still is not unique
    username += randomChoice(digits);
  }
  raise("Built username too many times");
}

const zodUrl = z.string().url();
/**
 * - https://stackoverflow.com/a/75540113
 * - https://stackoverflow.com/a/48568899
 */
async function uploadToStorage(
  srcUrl: string,
  filename: string,
): Promise<string> {
  const {
    SUPABASE_PROJECT_REF,
    SUPABASE_STORAGE_PORTRAITS_BUCKET_NAME,
    SUPABASE_SERVICE_KEY,
  } = env;
  const urls = {
    src: zodUrl.parse(srcUrl),
    dest: zodUrl.parse(
      `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/${SUPABASE_STORAGE_PORTRAITS_BUCKET_NAME}/${filename}`,
    ),
    public: zodUrl.parse(
      // TODO Prone to failure... more or less the same as upload endpoint but with "public" path in the middle
      `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/${SUPABASE_STORAGE_PORTRAITS_BUCKET_NAME}/${filename}`,
    ),
  };

  const srcRes = await fetch(urls.src);
  const blob = await srcRes.blob();

  const req = new Request(urls.dest, {
    method: "POST",
    body: blob,
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });

  const res = await fetch(req);
  const json = await res.json();
  if (!res.ok) {
    const { message } = z
      .object({ message: z.string().default("[unknown error]") })
      .parse(json);

    raise(`Failed uploading to storage: ${message}`);
  }

  return urls.public;
}

export async function createUserFromGoogle(
  googleId: string,
  handleName: string,
  portraitUrlGoogle: string,
  portraitUrlPlaceholder = env.PLACEHOLDER_PORTRAIT_URL,
): Promise<User> {
  return await db.transaction(async (tx) => {
    const existingUser = await _readUserViaGoogleId(tx, googleId);
    if (existingUser !== null)
      raise("Google ID already associated with a user");

    const username = await _buildUsernameFromHandle(tx, handleName);
    const initialUsers = await tx
      .insert(UsersTable)
      .values({
        ...{ username, handleName, googleId, loginCt: 0 },
        portraitUrl: portraitUrlPlaceholder,
      })
      .returning();
    if (initialUsers.length > 1) raise("Multiple Google users inserted...?");
    const initialUser =
      initialUsers[0] ?? raise("Inserted Google user does not exist...?");

    const portraitUrlActual = await uploadToStorage(
      portraitUrlGoogle,
      initialUser.id,
    );
    const users = await tx
      .update(UsersTable)
      .set({ portraitUrl: portraitUrlActual })
      .where(eq(UsersTable.id, initialUser.id))
      .returning();
    if (users.length > 1) raise("Multiple Google users updated...?");
    const user = users[0] ?? raise("Updated Google user does not exist...?");

    return user;
  });
}

export async function updateUser(
  id: User["id"],
  details: Partial<Omit<UserDetails, "id">>,
): Promise<User> {
  return await db.transaction(async (tx) => {
    const users = await tx
      .update(UsersTable)
      .set(details)
      .where(eq(UsersTable.id, id))
      .returning();

    if (users.length > 1) raise("Multiple users updated...?");
    const user = users[0] ?? raise("Updated user does not exist...?");

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
