import clsx from "clsx";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className={clsx("h-0 min-h-screen", "bg-fuchsia-950 text-white")}>
      <Outlet />
    </div>
  );
}
