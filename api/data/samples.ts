import { db } from "./db";
import { SamplesTable } from "./schema";

/* DELETEME */
(async () => {
  const samples = await getAllSamples();

  /* Only add sample data when nothing exists */
  if (samples.length !== 0) {
    console.warn("Sample data exists; skipping...");
    return;
  }

  const { randomInteger, randomNumberByLength, randomString } = await import(
    "../utils/random"
  );

  console.warn("Adding sample data...");
  Array.from({ length: 16 }, async () => {
    const fullName = randomString(randomInteger(8, 16));
    const phone = randomNumberByLength(randomInteger(8, 16)).toString();
    await addSample({ fullName, phone });
  });
  console.warn("Sample data added.");
})();

type Sample = typeof SamplesTable.$inferSelect;
type SampleDetails = typeof SamplesTable.$inferInsert;

export async function getAllSamples() {
  return await db.select().from(SamplesTable);
}

export async function addSample(details: Omit<SampleDetails, "id">) {
  const { fullName, phone } = details;

  await db.insert(SamplesTable).values({ fullName, phone });
}
