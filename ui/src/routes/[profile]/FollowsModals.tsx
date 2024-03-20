import { UserPublic } from "@spill-it/db/schema/drizzle";
import clsx from "clsx";
import { useEffect } from "react";
import { BsPersonPlusFill, BsXLg } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { endpointWithParam } from "../../utils/endpoints";
import { useProfileLoader } from "../[profile]";
import { clsBtnIcon, clsLink } from "../_app/classes";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";

function UserCard(props: { user: UserPublic }) {
  const { user } = props;

  const { handleName, username, portraitUrl } = user;
  return (
    <article className="flex items-center gap-3 rounded p-3 bg-white/10">
      <img
        src={portraitUrl}
        alt={`Portrait of "${handleName}"`}
        className="w-9 aspect-square rounded-full"
      />
      <header>
        <h3>
          <Link
            to={endpointWithParam("/:username", { username })}
            className={clsx("font-bold", clsLink)}
          >
            {handleName}
          </Link>
        </h3>
        <p className="text-white/50 text-sm">{username}</p>
      </header>
    </article>
  );
}

function FollowersModalContent() {
  const { profile, followers } = useProfileLoader();
  const { closeModal } = useModalContext();

  if (profile === null) return;
  if (followers === null) return;

  const { handleName } = profile;
  return (
    <ModalContent>
      <header className="flex items-center gap-6">
        <h2 className="text-xl">
          People who follow <span className="font-bold">{handleName}</span>
        </h2>

        <div className="ml-auto">
          <button onClick={closeModal} className={clsx(clsBtnIcon)}>
            <BsXLg />
          </button>
        </div>
      </header>

      <ol className="mt-3 grid gap-1">
        {followers.map(({ follower }) => (
          <UserCard key={follower.id} user={follower} />
        ))}
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
      navigate("..");
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

function FollowingRequestsModalContent() {
  const { followingRequests } = useProfileLoader();
  const { closeModal } = useModalContext();

  return (
    <ModalContent>
      <header className="flex items-center gap-6">
        <h2 className="text-xl font-bold tracking-wide">
          People you requested to follow
        </h2>

        <div className="ml-auto flex flex-row-reverse">
          <button onClick={closeModal} className={clsx(clsBtnIcon)}>
            <BsXLg className="w-full h-full" />
          </button>
        </div>
      </header>

      <ol className="mt-3 grid gap-1">
        {followingRequests?.map(({ following }) => (
          <UserCard key={following.id} user={following} />
        ))}
      </ol>
    </ModalContent>
  );
}
function FollowingModalContent() {
  const { profile, followings } = useProfileLoader();
  const { closeModal, showOnModal } = useModalContext();

  function showFollowingRequests() {
    showOnModal(<FollowingRequestsModalContent />);
  }

  if (profile === null) return;
  if (followings === null) return;

  const { handleName } = profile;
  return (
    <ModalContent>
      <header className="flex items-center gap-6">
        <h2 className="text-xl">
          People followed by <span className="font-bold">{handleName}</span>
        </h2>

        <div className="ml-auto flex flex-row-reverse">
          <button onClick={closeModal} className={clsx(clsBtnIcon)}>
            <BsXLg className="w-full h-full" />
          </button>
          <button onClick={showFollowingRequests} className={clsx(clsBtnIcon)}>
            <BsPersonPlusFill className="w-full h-full" />
          </button>
        </div>
      </header>

      <ol className="mt-3 grid gap-1">
        {followings.map(({ following }) => (
          <UserCard key={following.id} user={following} />
        ))}
      </ol>
    </ModalContent>
  );
}
function _FollowingModal() {
  const navigate = useNavigate();
  const { showOnModal, setOnDismiss } = useModalContext();
  useEffect(() => {
    showOnModal(<FollowingModalContent />);
    setOnDismiss(() => () => {
      navigate("..");
    });
  }, [showOnModal, setOnDismiss, navigate]);

  return null;
}
export function FollowingModal() {
  return (
    <ModalProvider>
      <_FollowingModal />

      <Modal />
    </ModalProvider>
  );
}
