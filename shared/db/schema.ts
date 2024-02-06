/**
 * https://orm.drizzle.team/docs/migrations
 * - Dedicated schema files recommended for migrations to avoid runtime executions...
 */

import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
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
export const zodSample = createSelectSchema(SamplesTable);

export const UsersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  handleName: text("handleName").notNull(),
  portraitUrl: text("portraitUrl").notNull(),
  googleId: text("googleId"),
  loginCt: integer("loginCt").notNull(),
});
export const zodUser = createSelectSchema(UsersTable);

export const SessionsTable = pgTable("sessions", {
  /**
   * UUID type mentioned in Drizzle docs but not in list
   * - https://orm.drizzle.team/docs/column-types/pg#default-value
   * - https://github.com/drizzle-team/drizzle-orm-docs/issues/120
   * - https://www.postgresql.org/docs/current/datatype-uuid.html
   */
  id: uuid("id").defaultRandom().primaryKey(),

  userId: integer("userId").notNull(), // Users primary key
  expiry: timestamp("expiry").notNull(),
});

export const PostsTable = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("userId").notNull(), // Users primary key
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  content: text("content").notNull(),
});
export const zodPost = createSelectSchema(PostsTable);

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
