/**
 * https://orm.drizzle.team/docs/migrations
 * - Dedicated schema files recommended for migrations to avoid runtime executions...
 */

import { integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

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
