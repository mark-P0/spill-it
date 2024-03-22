import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileLoader } from "../../[profile]";
import { useUserContext } from "../../_app/UserContext";
import { Modal, ModalContent } from "../../_app/modal/Modal";
import { ModalProvider, useModalContext } from "../../_app/modal/ModalContext";
import { EditProfileForm } from "./EditProfileForm";

function EditProfileModalContent() {
  return (
    <ModalContent className="max-w-screen-sm w-[75vw]">
      <EditProfileForm />
    </ModalContent>
  );
}
function _EditProfileModal() {
  const navigate = useNavigate();
  const { showOnModal, setOnDismiss } = useModalContext();
  useEffect(() => {
    showOnModal(<EditProfileModalContent />);
    setOnDismiss(() => () => {
      navigate("..");
    });
  }, [showOnModal, setOnDismiss, navigate]);

  return null;
}
export function EditProfileModal() {
  const { user, isUserInitialized } = useUserContext();
  const { profile } = useProfileLoader();

  const isOwnProfile = user?.id === profile.id;

  if (!isUserInitialized) return null;
  if (user === null) {
    throw new Error("Cannot edit own profile if current info is not available");
  }
  if (!isOwnProfile) {
    throw new Error("Cannot edit profile of other users");
  }

  return (
    <ModalProvider>
      <_EditProfileModal />

      <Modal />
    </ModalProvider>
  );
}
