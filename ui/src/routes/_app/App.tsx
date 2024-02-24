import { Outlet } from "react-router-dom";
import { UserProvider } from "./UserContext";
import { Modal } from "./modal/Modal";
import { ModalProvider } from "./modal/ModalContext";
import { Toast } from "./toast/Toast";
import { ToastProvider } from "./toast/ToastContext";

export function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <ModalProvider>
          <Outlet />

          <Modal />
        </ModalProvider>

        <Toast />
      </ToastProvider>
    </UserProvider>
  );
}
