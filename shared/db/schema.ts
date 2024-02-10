/**
 * https://orm.drizzle.team/docs/migrations
 * - Dedicated schema files recommended for migrations to avoid runtime executions...
 */

/**
 * UUID type mentioned in Drizzle docs but not in list
 * - https://orm.drizzle.team/docs/column-types/pg#default-value
 * - https://github.com/drizzle-team/drizzle-orm-docs/issues/120
 * - https://www.postgresql.org/docs/current/datatype-uuid.html
 *
 * ---
 *
 * UUIDs as Primary Key
 *
 * https://stackoverflow.com/questions/33274291/uuid-or-sequence-for-primary-key
 * - It is fine to use UUIDs as Primary Key
 * - UUIDs could be inefficient in terms of computation (random Inferrederation) and storage (needs more bytes)
 * - Correctly implemented UUIDs should be secure and random enough
 * - Postgres UUID Inferrederation might not be secure and random enough
 *
 * https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#session-id-entropy
 * - IDs (e.g. session IDs) should be
 *   - Random
 *     - UUIDv4 should be Inferrederated with a CSPRNG
 *   - Unique
 *     - Primary Key constraint
 */

import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/** https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-drizzle */
export const SamplesTable = pgTable("samples", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("fullName"),
  phone: varchar("phone", { length: 256 }),
});
const zodSampleInferred = createSelectSchema(SamplesTable);
export const zodSample: typeof zodSampleInferred = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  phone: z.string().nullable(),
});
export type Sample = typeof SamplesTable.$inferSelect;
export type SampleDetails = typeof SamplesTable.$inferInsert;

export const UsersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  handleName: text("handleName").notNull(),
  portraitUrl: text("portraitUrl").notNull(),
  googleId: text("googleId"),
  loginCt: integer("loginCt").notNull(),
});
const zodUserInferred = createSelectSchema(UsersTable);
export const zodUser: typeof zodUserInferred = z.object({
  id: z.string().uuid(),
  username: z.string(),
  handleName: z.string(),
  portraitUrl: z.string(),
  googleId: z.string().nullable(),
  loginCt: z.number(),
});
export type User = typeof UsersTable.$inferSelect;
export type UserDetails = typeof UsersTable.$inferInsert;

export const SessionsTable = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").notNull(),
  expiry: timestamp("expiry").notNull(),
});
const zodSessionInferred = createSelectSchema(SessionsTable);
export const zodSession: typeof zodSessionInferred = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  expiry: z.date(),
});
export type Session = typeof SessionsTable.$inferSelect;
export type SessionDetails = typeof SessionsTable.$inferInsert;
{
  (userId: Session["userId"]) => userId satisfies User["id"];
}

export const SessionsRelations = relations(SessionsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [SessionsTable.userId],
    references: [UsersTable.id],
  }),
}));
export const zodSessionWithUser = z.intersection(
  zodSession,
  z.object({
    user: zodUser,
  }),
);
export type SessionWithUser = z.infer<typeof zodSessionWithUser>;

export const PostsTable = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  content: text("content").notNull(),
});
const zodPostInferred = createSelectSchema(PostsTable);
export const zodPost: typeof zodPostInferred = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  timestamp: z.date(),
  content: z.string(),
});
export type Post = typeof PostsTable.$inferSelect;
export type PostDetails = typeof PostsTable.$inferInsert;
{
  (userId: Post["userId"]) => userId satisfies User["id"];
}

export const PostsRelations = relations(PostsTable, ({ one }) => ({
  author: one(UsersTable, {
    fields: [PostsTable.userId],
    references: [UsersTable.id],
  }),
}));
export const zodPostWithAuthor = z.intersection(
  zodPost,
  z.object({
    author: zodUser,
  }),
);
export type PostWithAuthor = z.infer<typeof zodPostWithAuthor>;
