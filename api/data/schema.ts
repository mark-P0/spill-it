/**
 * https://orm.drizzle.team/docs/migrations
 * - Dedicated schema files recommended for migrations to avoid runtime executions...
 */

import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

/** https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-drizzle */
export const SamplesTable = pgTable("samples", {
  id: serial("id").primaryKey(),
  fullName: text("fullName"),
  phone: varchar("phone", { length: 256 }),
});
