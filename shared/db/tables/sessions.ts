import { tomorrow } from "@spill-it/utils/dates";
import { raise } from "@spill-it/utils/errors";
import { isPast } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  Session,
  SessionWithUser,
  SessionsTable,
  User,
} from "../schema/drizzle";

export function isSessionExpired(session: Session) {
  return isPast(session.expiry);
}

export async function readSessionOfUser(
  userId: User["id"],
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
    with: {
      user: true,
    },
  });

  if (sessions.length > 1) raise("Multiple sessions for an ID...?");
  const session = sessions[0] ?? null;

  return session;
}

export async function createSession(userId: User["id"]): Promise<Session> {
  const defaultExpiry = tomorrow();
  const sessions = await db
    .insert(SessionsTable)
    .values({ userId, expiry: defaultExpiry })
    .returning();

  if (sessions.length > 1) raise("Multiple sessions inserted...?");
  const session = sessions[0] ?? raise("Inserted session does not exist...?");

  return session;
}

export async function deleteSession(id: Session["id"]) {
  await db.delete(SessionsTable).where(eq(SessionsTable.id, id));
}
