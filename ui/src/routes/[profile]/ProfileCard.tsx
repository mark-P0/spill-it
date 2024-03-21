import clsx from "clsx";
import { BsLockFill } from "react-icons/bs";
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

export function ProfileCard() {
  const { profile } = useProfileLoader();

  const { handleName, username, bio, portraitUrl, isPrivate } = profile;

  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-x-6">
      <div>
        <header>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{handleName}</h1>
            {isPrivate && <BsLockFill className="h-6 w-6 text-emerald-500" />}
          </div>
          <p className="text-lg text-white/50">{username}</p>
        </header>
      </div>

      <div className="col-span-2">
        {bio !== "" && <p className="my-1">{bio}</p>}
      </div>

      <div className="col-span-2">
        <FollowCountsNav />
      </div>

      <div className="col-start-2 row-start-1 place-self-start">
        <ProfileActionButton />
      </div>

      <div className="col-start-3 row-start-1 row-span-3">
        <img
          src={portraitUrl}
          alt={`Portrait of "${handleName}"`}
          className="w-20 aspect-square rounded-full"
        />
      </div>
    </article>
  );
}
