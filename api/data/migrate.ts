import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";

/** https://orm.drizzle.team/docs/migrations */
async function migration() {
  await migrate(db, {
    migrationsFolder: "./data/migrations", // Relative to project root...
  });
}
migration();
