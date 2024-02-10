import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { db } from "../db";
import { Sample, SampleDetails, SamplesTable } from "../schema/drizzle";

// /* DELETEME */
// (async () => {
//   const { localizeLogger } = await import("../src/utils/logger");
//   const logger = localizeLogger(__filename);
//
//   const samples = await readSamplesAll();
//
//   /* Only add sample data when nothing exists */
//   if (samples.length !== 0) {
//     logger.warn("Sample data exists; skipping...", { file: import.meta.url });
//     return;
//   }
//
//   const { randomInteger, randomNumberByLength, randomString } = await import(
//     "../src/utils/random"
//   );
//
//   logger.warn("Adding sample data...", { file: import.meta.url });
//   Array.from({ length: 16 }, async () => {
//     const fullName = randomString(randomInteger(8, 16));
//     const phone = randomNumberByLength(randomInteger(8, 16)).toString();
//     await createSample({ fullName, phone });
//   });
//   logger.warn("Sample data added.", { file: import.meta.url });
// })();

export async function readSamplesAll(): Promise<Sample[]> {
  const result = await safeAsync(() => db.select().from(SamplesTable));
  const samples = result.success
    ? result.value
    : raise("Failed reading samples table", result.error);

  return samples;
}

export async function createSample(
  details: Omit<SampleDetails, "id">,
): Promise<Sample> {
  const { fullName, phone } = details;
  const result = await safeAsync(() =>
    db.insert(SamplesTable).values({ fullName, phone }).returning(),
  );
  const samples = result.success
    ? result.value
    : raise("Failed inserting to samples table", result.error);

  if (samples.length > 1) raise("Multiple samples inserted...?");
  const sample = samples[0] ?? raise("Inserted sample does not exist...?");

  return sample;
}
