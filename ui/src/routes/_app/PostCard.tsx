import { PostWithAuthor } from "@spill-it/db/schema/drizzle";
import clsx from "clsx";
import { format } from "date-fns";
import { BsLockFill, BsTrashFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { PostDateText } from "./PostDateText";
import { PostDeletionModalContent } from "./PostDeletionForm";
import { useUserContext } from "./UserContext";
import { clsLink, clsSmallBtnIcon } from "./classes";
import { useModalContext } from "./modal/ModalContext";

function formatPostDateTooltip(date: PostWithAuthor["timestamp"]) {
  /** e.g. 'Wed, 18 Sep 2019 19:00:52 GMT' */
  const formatStr = "iii, d LLL y HH:mm:ss OOO";
  const str = format(date, formatStr);

  return str;
}
export function PostCard(props: {
  post: PostWithAuthor;
  onDeleteEnd?: () => void;
}) {
  const { user } = useUserContext();
  const { showOnModal } = useModalContext();
  const { post, onDeleteEnd } = props;
  const { content, timestamp, author } = post;
  const { username, handleName, portraitUrl, isPrivate } = author;

  const canDelete = user?.id === author?.id;

  function promptDelete() {
    showOnModal(
      <PostDeletionModalContent
        postToDelete={post}
        onDeleteEnd={onDeleteEnd}
      />,
    );
  }

  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-lg p-4 bg-white/10">
      <div>
        <img
          src={portraitUrl}
          alt={`Portrait of "${handleName}"`}
          className="w-9 aspect-square rounded-full"
        />
      </div>

      <div>
        <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3>
            <Link
              to={endpointWithParam("/:username", { username })}
              className={clsx("font-bold", clsLink)}
            >
              {handleName}
            </Link>
          </h3>

          {isPrivate && (
            <div>
              <BsLockFill className="text-emerald-500" />
            </div>
          )}

          <span className="text-white/50 select-none text-sm">{username}</span>
          <span className="text-white/50 select-none">•</span>
          <span
            title={formatPostDateTooltip(timestamp)}
            className="text-white/50 select-none text-xs uppercase tracking-wide"
          >
            <PostDateText date={timestamp} />
          </span>
        </header>

        <p className="mt-1 whitespace-pre-wrap">{content}</p>
      </div>

      <div>
        {canDelete && (
          <button onClick={promptDelete} className={clsx(clsSmallBtnIcon)}>
            <BsTrashFill />
          </button>
        )}
      </div>
    </article>
  );
}
