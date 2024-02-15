import { UserPublic } from "@spill-it/db/schema/drizzle";
import clsx from "clsx";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";
import { useProfileContext } from "./ProfileContext";

function UserCard(props: { user: UserPublic }) {
  const { user } = props;

  const { handleName, username, portraitUrl } = user;
  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-3 bg-white/10 p-3">
      <div>
        <img
          src={portraitUrl}
          alt={`Portrait of "${handleName}"`}
          className="w-9 aspect-square rounded-full"
        />
      </div>
      <header>
        <h3 className="font-bold">
          <Link
            to={endpointWithParam("/:username", { username })}
            className={clsx(
              // "text-xs uppercase tracking-wide",
              "underline underline-offset-4",
              ...["transition", "text-white hover:text-fuchsia-500"],
            )}
          >
            {handleName}
          </Link>
        </h3>
        <p className="text-white/50 text-sm">{username}</p>
      </header>
      <div></div>
    </article>
  );
}

function FollowersModalContent() {
  const { profile } = useProfileContext();

  if (profile === null) return null;
  const { handleName, followers } = profile;

  return (
    <ModalContent>
      <h2 className="text-xl">
        Follows <span className="font-bold">{handleName}</span>
      </h2>

      <ol className="mt-3">
        {followers.map(({ follower }) => {
          return (
            <li key={follower.id}>
              <UserCard user={follower} />
            </li>
          );
        })}
      </ol>
    </ModalContent>
  );
}
function _FollowersModal() {
  const navigate = useNavigate();
  const { showOnModal, setOnDismiss } = useModalContext();
  useEffect(() => {
    showOnModal(<FollowersModalContent />);
    setOnDismiss(() => () => {
      navigate(-1);
    });
  }, [showOnModal, setOnDismiss, navigate]);

  return null;
}
export function FollowersModal() {
  return (
    <ModalProvider>
      <_FollowersModal />

      <Modal />
    </ModalProvider>
  );
}
