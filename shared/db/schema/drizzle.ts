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
 * - UUIDs could be inefficient in terms of computation (random generation) and storage (needs more bytes)
 * - Correctly implemented UUIDs should be secure and random enough
 * - Postgres UUID generation might not be secure and random enough
 *
 * https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#session-id-entropy
 * - IDs (e.g. session IDs) should be
 *   - Random
 *     - UUIDv4 should be generated with a CSPRNG
 *   - Unique
 *     - Primary Key constraint
 */

import { relations } from "drizzle-orm";
import {
  boolean,
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
const drizzleZodSample = createSelectSchema(SamplesTable);
export type DrizzleZodSample = typeof drizzleZodSample;
export type Sample = typeof SamplesTable.$inferSelect;
export type SampleDetails = typeof SamplesTable.$inferInsert;

// TODO Reflect validations? Via `varchar()`? `CONSTRAINT` seems to be best and least intrusive but is not yet supported by Drizzle...
export const UsersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  registrationDate: timestamp("registrationDate").notNull().defaultNow(),
  username: text("username").notNull().unique(),
  handleName: text("handleName").notNull(),
  portraitUrl: text("portraitUrl").notNull(),
  bio: text("bio").notNull().default(""),
  isPrivate: boolean("isPrivate").notNull().default(false),
  googleId: text("googleId"),
  loginCt: integer("loginCt").notNull(),
});
const drizzleZodUser = createSelectSchema(UsersTable);
export type DrizzleZodUser = typeof drizzleZodUser;
export type User = typeof UsersTable.$inferSelect;
export type UserDetails = typeof UsersTable.$inferInsert;

const drizzleZodUserPublic = drizzleZodUser.pick({
  id: true,
  registrationDate: true,
  username: true,
  handleName: true,
  portraitUrl: true,
  bio: true,
  isPrivate: true,
  // googleId: true,
  loginCt: true,
});
export type DrizzleZodUserPublic = typeof drizzleZodUserPublic;
export type UserPublic = z.infer<DrizzleZodUserPublic>;

const drizzleZodUserPublicDetails = drizzleZodUser
  .pick({
    // id: true,
    // registrationDate: true,
    username: true,
    handleName: true,
    portraitUrl: true,
    bio: true,
    isPrivate: true,
    // googleId: true,
    // loginCt: true,
  })
  .partial();
export type DrizzleZodUserPublicDetails = typeof drizzleZodUserPublicDetails;
export type UserPublicDetails = z.infer<DrizzleZodUserPublicDetails>;

export const UsersRelations = relations(UsersTable, ({ many }) => ({
  followers: many(FollowsTable, { relationName: "following" }), // The followers of a user are users that are following them
  followings: many(FollowsTable, { relationName: "follower" }), // The followings of a user are users that they are a follower of
}));

export const FollowsTable = pgTable("follows", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  followerUserId: uuid("followerUserId").notNull(),
  followingUserId: uuid("followingUserId").notNull(),
});
const drizzleZodFollow = createSelectSchema(FollowsTable);
export type DrizzleZodFollow = typeof drizzleZodFollow;
export type Follow = typeof FollowsTable.$inferSelect;
export type FollowDetails = typeof FollowsTable.$inferInsert;

export const FollowsRelations = relations(FollowsTable, ({ one }) => ({
  follower: one(UsersTable, {
    relationName: "follower",
    fields: [FollowsTable.followerUserId],
    references: [UsersTable.id],
  }),
  following: one(UsersTable, {
    relationName: "following",
    fields: [FollowsTable.followingUserId],
    references: [UsersTable.id],
  }),
}));
const drizzleZodFollowWithUsers = drizzleZodFollow.extend({
  follower: drizzleZodUserPublic,
  following: drizzleZodUserPublic,
});
export type DrizzleZodFollowWithUsers = typeof drizzleZodFollowWithUsers;
export type FollowWithUsers = z.infer<DrizzleZodFollowWithUsers>;

export const SessionsTable = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").notNull(),
  expiry: timestamp("expiry").notNull(),
});
const drizzleZodSession = createSelectSchema(SessionsTable);
export type DrizzleZodSession = typeof drizzleZodSession;
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
const drizzleZodSessionWithUser = drizzleZodSession.extend({
  user: drizzleZodUserPublic,
});
export type DrizzleZodSessionWithUser = typeof drizzleZodSessionWithUser;
export type SessionWithUser = z.infer<typeof drizzleZodSessionWithUser>;

export const PostsTable = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  content: text("content").notNull(),
});
const drizzleZodPost = createSelectSchema(PostsTable);
export type DrizzleZodPost = typeof drizzleZodPost;
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
const drizzleZodPostWithAuthor = drizzleZodPost.extend({
  author: drizzleZodUserPublic,
});
export type DrizzleZodPostWithAuthor = typeof drizzleZodPostWithAuthor;
export type PostWithAuthor = z.infer<typeof drizzleZodPostWithAuthor>;
