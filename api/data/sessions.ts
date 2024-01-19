import { env } from "@spill-it/env";
import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { addDays, addMinutes, isBefore } from "date-fns";
import { eq } from "drizzle-orm";
import { localizeLogger } from "../src/utils/logger";
import { db } from "./db";
import { SessionsTable } from "./schema";
import { User } from "./users";

const logger = localizeLogger(import.meta.url);
type Session = typeof SessionsTable.$inferSelect;
type SessionDetails = typeof SessionsTable.$inferInsert;

export function isSessionExpired(session: Session) {
  return isBefore(session.expiry, new Date());
}

export async function readUserSession(
  userId: User["id"],
): Promise<Session | null> {
  const result = await safeAsync(() =>
    db
      .select()
      .from(SessionsTable)
      .where(eq(SessionsTable.userId, userId))
      .limit(2),
  );
  const sessions = result.success
    ? result.value
    : raise("Failed reading sessions table", result.error);

  /* TODO Should multiple sessions per user be possible? */
  if (sessions.length > 1) raise("Multiple sessions for a user...?");
  const session = sessions[0] ?? null;

  return session;
}

export async function readSessionFromUUID(
  uuid: Session["uuid"],
): Promise<Session | null> {
  const result = await safeAsync(
    () =>
      db
        .select()
        .from(SessionsTable)
        .where(eq(SessionsTable.uuid, uuid))
        .limit(2), // There should only be at most 1. If there are 2 (or more), something has gone wrong...
  );
  const sessions = result.success
    ? result.value
    : raise("Failed reading sessions table", result.error);

  if (sessions.length > 1) raise("Multiple sessions for a UUID...?");
  const session = sessions[0] ?? null;

  return session;
}

const today = () => new Date();
const tomorrow = () => addDays(today(), 1);
const after1Min = () => addMinutes(today(), 1);
const defaultExpiry = () => {
  switch (env.NODE_ENV) {
    case "development": {
      logger.warn("Using development default session expiry");
      return after1Min();
    }
    case "production":
      return tomorrow();
  }
  env.NODE_ENV satisfies never;
};
export async function createSession(userId: User["id"]): Promise<Session> {
  const result = await safeAsync(() =>
    db
      .insert(SessionsTable)
      .values({ userId, expiry: defaultExpiry() })
      .returning(),
  );
  const sessions = result.success
    ? result.value
    : raise("Failed inserting to sessions table", result.error);

  if (sessions.length > 1) raise("Multiple sessions inserted...?");
  const session = sessions[0] ?? raise("Inserted session does not exist...?");

  return session;
}

export async function deleteSession(id: Session["id"]) {
  const result = await safeAsync(() =>
    db.delete(SessionsTable).where(eq(SessionsTable.id, id)),
  );
  if (!result.success) raise("Failed deleting on sessions table", result.error);
}
