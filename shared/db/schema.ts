/**
 * https://orm.drizzle.team/docs/migrations
 * - Dedicated schema files recommended for migrations to avoid runtime executions...
 */

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

/** https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-drizzle */
export const SamplesTable = pgTable("samples", {
  id: serial("id").primaryKey(),
  fullName: text("fullName"),
  phone: varchar("phone", { length: 256 }),
});
export const zodSample = createSelectSchema(SamplesTable);

export const UsersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  handleName: text("handleName").notNull(),
  portraitUrl: text("portraitUrl").notNull(),
  googleId: text("googleId"),
  loginCt: integer("loginCt").notNull(),
});
export const zodUser = createSelectSchema(UsersTable);

export const SessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),

  /**
   * UUID type mentioned in Drizzle docs but not in list
   * - https://orm.drizzle.team/docs/column-types/pg#default-value
   * - https://github.com/drizzle-team/drizzle-orm-docs/issues/120
   * - https://www.postgresql.org/docs/current/datatype-uuid.html
   */
  uuid: uuid("uuid").unique().notNull().defaultRandom(),

  userId: integer("userId").notNull(), // Users primary key
  expiry: timestamp("expiry").notNull(),
});