import { addDays, addMinutes, isBefore } from "date-fns";
import { eq } from "drizzle-orm";
import { env } from "../utils/env";
import { safeAsync } from "../utils/try-catch";
import { db } from "./db";
import { SessionsTable } from "./schema";
import { User } from "./users";

export function isSessionExpired(session: Session) {
  return isBefore(session.expiry, new Date());
}

type Session = typeof SessionsTable.$inferSelect;
type SessionDetails = typeof SessionsTable.$inferInsert;

export async function readUserSession(
  userId: User["id"]
): Promise<Session | null> {
  const resultSessions = await safeAsync(() =>
    db.select().from(SessionsTable).where(eq(SessionsTable.userId, userId))
  );
  if (!resultSessions.success) {
    throw new Error("Failed reading sessions table");
  }
  const sessions = resultSessions.value;

  return sessions[0] ?? null;
}

const today = () => new Date();
const tomorrow = () => addDays(today(), 1);
const after1Min = () => addMinutes(today(), 1);
const defaultExpiry = () => {
  switch (env.NODE_ENV) {
    case "development":
      return after1Min();
    case "production":
      return tomorrow();
  }
  env.NODE_ENV satisfies never;
};
export async function createSession(userId: User["id"]): Promise<Session> {
  const resultInsert = await safeAsync(() =>
    db
      .insert(SessionsTable)
      .values({ userId, expiry: defaultExpiry() })
      .returning()
  );
  if (!resultInsert.success) {
    throw new Error("Failed inserting to sessions table");
  }
  const sessions = resultInsert.value;

  const session = sessions[0];
  if (session === undefined) {
    throw new Error("Inserted session does not exist...?");
  }

  return session;
}
