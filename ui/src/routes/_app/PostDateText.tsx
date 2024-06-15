import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import { today } from "@spill-it/utils/dates";
import { differenceInHours, format, formatDistanceToNow } from "date-fns";

function formatPostDate(date: PostWithAuthor["timestamp"]): string {
  const isInThePastDay = differenceInHours(today(), date) < 24;
  if (isInThePastDay) {
    return formatDistanceToNow(date, {
      addSuffix: true,
      includeSeconds: true,
    });
  }

  /**
   * e.g. 16 Mar 2020
   *
   * https://date-fns.org/v3.6.0/docs/format
   */
  const DD_MMM_YYYY = "d LLL y";
  return format(date, DD_MMM_YYYY);
}

export function PostDateText(props: { date: Date }) {
  const { date } = props;

  return formatPostDate(date);
}
