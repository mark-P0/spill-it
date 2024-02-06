import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { addDays, isPast } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { Session, SessionWithUser, SessionsTable, User } from "../schema";

export function isSessionExpired(session: Session) {
  return isPast(session.expiry);
}

export async function readSessionOfUser(
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

  // TODO Should multiple sessions per user be possible?
  if (sessions.length > 1) raise("Multiple sessions for a user...?");
  const session = sessions[0] ?? null;

  return session;
}

export async function readSession(id: Session["id"]): Promise<Session | null> {
  const result = await safeAsync(
    () =>
      db.select().from(SessionsTable).where(eq(SessionsTable.id, id)).limit(2), // There should only be at most 1. If there are 2 (or more), something has gone wrong...
  );
  const sessions = result.success
    ? result.value
    : raise("Failed reading sessions table", result.error);

  if (sessions.length > 1) raise("Multiple sessions for an ID...?");
  const session = sessions[0] ?? null;

  return session;
}

export async function readSessionWithUser(
  id: SessionWithUser["id"],
): Promise<SessionWithUser | null> {
  const result = await safeAsync(() =>
    db.query.SessionsTable.findMany({
      where: eq(SessionsTable.id, id),
      limit: 2, // There should only be at most 1. If there are 2 (or more), something has gone wrong...
      with: {
        user: true,
      },
    }),
  );
  const sessions = result.success
    ? result.value
    : raise("Failed querying sessions table", result.error);

  if (sessions.length > 1) raise("Multiple sessions for an ID...?");
  const session = sessions[0] ?? null;

  return session;
}

const today = () => new Date();
const tomorrow = () => addDays(today(), 1);
const defaultExpiry = () => tomorrow();
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
