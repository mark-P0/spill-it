import { useEffect } from "react";
import { Modal, ModalContent } from "../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../_app/modal/ModalContext";

function FollowersModalContent() {
  return <ModalContent>Followers list</ModalContent>;
}
function _FollowersModal() {
  const { showOnModal } = useModalContext();
  useEffect(() => {
    showOnModal(<FollowersModalContent />);
  }, [showOnModal]);

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
