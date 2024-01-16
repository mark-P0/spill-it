import { addDays, addMinutes, isBefore } from "date-fns";
import { eq } from "drizzle-orm";
import { env } from "../utils/env";
import { localizeLogger } from "../utils/logger";
import { ensureError, safeAsync } from "../utils/try-catch";
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
  userId: User["id"]
): Promise<Session | null> {
  const result = await safeAsync(() =>
    db.select().from(SessionsTable).where(eq(SessionsTable.userId, userId))
  );
  if (!result.success) {
    throw new Error("Failed reading sessions table");
  }
  const sessions = result.value;

  return sessions[0] ?? null;
}

export async function readSessionFromUUID(
  uuid: Session["uuid"]
): Promise<Session | null> {
  const result = await safeAsync(() =>
    db.select().from(SessionsTable).where(eq(SessionsTable.uuid, uuid))
  );
  if (!result.success) {
    throw new Error("Failed reading sessions table", { cause: result.error });
  }
  const sessions = result.value;

  return sessions[0] ?? null;
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
      .returning()
  );
  if (!result.success) {
    throw new Error("Failed inserting to sessions table");
  }
  const sessions = result.value;

  const session = sessions[0];
  if (session === undefined) {
    throw new Error("Inserted session does not exist...?");
  }

  return session;
}

export async function deleteSession(id: Session["id"]) {
  try {
    await db.delete(SessionsTable).where(eq(SessionsTable.id, id));
  } catch (possibleError) {
    const error = ensureError(possibleError);
    throw new Error("Failed deleting on sessions table", { cause: error });
  }
}
