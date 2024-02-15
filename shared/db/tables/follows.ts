import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { db } from "../db";
import { Follow, FollowDetails, FollowsTable } from "../schema/drizzle";

export async function createFollow(details: FollowDetails): Promise<Follow> {
  const result = await safeAsync(() =>
    db.insert(FollowsTable).values(details).returning(),
  );
  const follows = result.success
    ? result.value
    : raise("Failed creating follow entry", result.error);

  if (follows.length > 1) raise("Multiple follow entries created...?");
  const follow = follows[0] ?? raise("Created follow entry does not exist...?");

  return follow;
}
