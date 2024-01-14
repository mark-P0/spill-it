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
  varchar,
} from "drizzle-orm/pg-core";

/** https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-drizzle */
export const SamplesTable = pgTable("samples", {
  id: serial("id").primaryKey(),
  fullName: text("fullName"),
  phone: varchar("phone", { length: 256 }),
});

export const UsersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  handleName: text("handleName").notNull(),
  portraitUrl: text("portraitUrl").notNull(),
  googleId: text("googleId"),
  loginCt: integer("loginCt").notNull(),
});
/** Can be any name? */
export const UsersRelations = relations(UsersTable, ({ one }) => ({
  session: one(SessionsTable, {
    /** The field(s) of the table on which we are defining the relationship... */
    fields: [UsersTable.id],
    /** ...is referencing / referenced by the other table. */
    references: [SessionsTable.userId],
  }),
}));

export const SessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("authorId").notNull(), // Users primary key
  expiry: timestamp("expiry").notNull(),
});
type Session = typeof SessionsTable.$inferSelect; // DELETEME
