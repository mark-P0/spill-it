import { UserPublic } from "@spill-it/db/schema/drizzle";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";
import { useProfileContext } from "./ProfileContext";

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
        <h3 className="font-bold">{handleName}</h3>
        <p className="text-white/50 text-sm">{username}</p>
      </header>
    </article>
  );
}

function FollowersModalContent() {
  const { profile, followers } = useProfileContext();

  if (profile === null) return;
  if (followers === null) return;

  const { handleName } = profile;
  return (
    <ModalContent>
      <h2 className="text-xl">
        People who follow <span className="font-bold">{handleName}</span>
      </h2>

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

function FollowingModalContent() {
  const { profile, followings } = useProfileContext();

  if (profile === null) return;
  if (followings === null) return;

  const { handleName } = profile;
  return (
    <ModalContent>
      <h2 className="text-xl">
        People followed by <span className="font-bold">{handleName}</span>
      </h2>

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
