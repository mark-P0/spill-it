import clsx from "clsx";
import { format } from "date-fns";
import { BsCalendarEvent, BsLockFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { useProfileLoader } from "../[profile]";
import { clsLinkTranslucent } from "../_app/classes";
import { ProfileActionButton } from "./ProfileActionButton";

function FollowCountsNav() {
  const { profile, followers, followings } = useProfileLoader();
  const { username } = profile;

  if (followers === null || followings === null) return null;

  return (
    <nav className="flex gap-3">
      <Link
        to={endpointWithParam("/:username/followers", { username })}
        className={clsx("text-xs uppercase tracking-wide", clsLinkTranslucent)}
      >
        <span className="font-bold text-base">{followers.length}</span>{" "}
        {followers.length === 1 ? <>follower</> : <>followers</>}
      </Link>

      <Link
        to={endpointWithParam("/:username/following", { username })}
        className={clsx("text-xs uppercase tracking-wide", clsLinkTranslucent)}
      >
        <span className="font-bold text-base">{followings.length}</span>{" "}
        following
      </Link>
    </nav>
  );
}

function formatJoinDate(date: Date): string {
  const MMM_YYYY = "LLL y";
  return format(date, MMM_YYYY);
}
function JoinDate(props: { date: Date }) {
  const { date } = props;

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/50">
        <BsCalendarEvent />
      </span>

      <p className="text-white/50">Joined {formatJoinDate(date)}</p>
    </div>
  );
}

export function ProfileCard() {
  const { profile } = useProfileLoader();

  const {
    registrationDate,
    handleName,
    username,
    bio,
    portraitUrl,
    isPrivate,
  } = profile;

  return (
    <article className="text-sm md:text-base">
      <div className="flex items-start gap-x-3">
        <div>
          <img
            src={portraitUrl}
            alt={`Portrait of "${handleName}"`}
            className="w-24 aspect-square rounded-full"
          />
        </div>

        <div className="ml-auto">
          <ProfileActionButton />
        </div>
      </div>

      <header className="mt-3">
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="mr-3">{handleName}</span>
          {isPrivate && (
            <BsLockFill className="inline align-baseline h-6 w-6 text-emerald-500" />
          )}
        </h1>
        <p className="text-md md:text-lg text-white/50">{username}</p>
      </header>

      {bio !== "" && <p className="my-2">{bio}</p>}
      <JoinDate date={registrationDate} />
      <FollowCountsNav />
    </article>
  );
}
