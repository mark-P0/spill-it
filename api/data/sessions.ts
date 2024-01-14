import { isBefore } from "date-fns";
import { eq } from "drizzle-orm";
import { safeAsync } from "../utils/try-catch";
import { db } from "./db";
import { SessionsTable } from "./schema";
import { User } from "./users";

export function isSessionExpired(session: Session) {
  return isBefore(session.expiry, new Date());
}

type Session = typeof SessionsTable.$inferSelect;

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
