import { tomorrow } from "@spill-it/utils/dates";
import { raise } from "@spill-it/utils/errors";
import { isPast } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { Session, SessionWithUser, SessionsTable } from "../schema/drizzle";
import { readUserViaUsername } from "./users";

export function isSessionExpired(session: Session) {
  return isPast(session.expiry);
}

export async function readSessionOfGuest(): Promise<Session> {
  return await db.transaction(async (tx) => {
    const guest =
      (await readUserViaUsername("guest")) ??
      raise("Guest user does not exist...?");

    const sessions = await tx
      .select()
      .from(SessionsTable)
      .where(eq(SessionsTable.userId, guest.id))
      .limit(2);

    if (sessions.length > 1) raise("Multiple sessions for guest...?");
    const session = sessions[0] ?? raise("Guest session does not exist...?");

    return session;
  });
}

export async function readSessionViaUser(
  userId: Session["userId"],
): Promise<Session | null> {
  const sessions = await db
    .select()
    .from(SessionsTable)
    .where(eq(SessionsTable.userId, userId))
    .limit(2);

  // TODO Should multiple sessions per user be possible?
  if (sessions.length > 1) raise("Multiple sessions for a user...?");
  const session = sessions[0] ?? null;

  return session;
}

export async function readSession(id: Session["id"]): Promise<Session | null> {
  const sessions = await db
    .select()
    .from(SessionsTable)
    .where(eq(SessionsTable.id, id))
    .limit(2); // There should only be at most 1. If there are 2 (or more), something has gone wrong...

  if (sessions.length > 1) raise("Multiple sessions for an ID...?");
  const session = sessions[0] ?? null;

  return session;
}

export async function readSessionWithUser(
  id: SessionWithUser["id"],
): Promise<SessionWithUser | null> {
  const sessions = await db.query.SessionsTable.findMany({
    where: eq(SessionsTable.id, id),
    limit: 2, // There should only be at most 1. If there are 2 (or more), something has gone wrong...
    with: { user: true },
  });

  if (sessions.length > 1) raise("Multiple sessions for an ID...?");
  const session = sessions[0] ?? null;

  return session;
}

export async function createSession(
  userId: Session["userId"],
): Promise<Session> {
  return await db.transaction(async (tx) => {
    const defaultExpiry = tomorrow();
    const sessions = await tx
      .insert(SessionsTable)
      .values({ userId, expiry: defaultExpiry })
      .returning();

    if (sessions.length > 1) raise("Multiple sessions inserted...?");
    const session = sessions[0] ?? raise("Inserted session does not exist...?");

    return session;
  });
}

export async function deleteSession(id: Session["id"]): Promise<Session> {
  return await db.transaction(async (tx) => {
    const sessions = await tx
      .delete(SessionsTable)
      .where(eq(SessionsTable.id, id))
      .returning();

    if (sessions.length > 1) raise("Multiple sessions deleted...?");
    const session = sessions[0] ?? raise("Deleted session does not exist...?");

    return session;
  });
}
