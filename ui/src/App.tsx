import { buildHeaderAuth } from "@spill-it/header-auth";
import { Route, redirect } from "react-router-dom";
import { fetchAPI } from "./utils/fetch-api";

async function isSessionValid(): Promise<boolean> {
  const id = localStorage.getItem("SPILLITSESS");
  if (id === null) return false;

  const res = await fetchAPI("/api/v0/users/me", {
    headers: {
      Authorization: buildHeaderAuth("SPILLITSESS", { id }),
    },
  });
  if (!res.success) return false;

  return true;
}

export const RootRoute = (
  <Route
    path="/"
    loader={async () => {
      const isValid = await isSessionValid();
      if (isValid) return redirect("/home");
      return redirect("/welcome");
    }}
    element={null}
  />
);

// TODO Move to own route file?
function HomeScreen() {
  return (
    <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
      Home page
    </main>
  );
}
export const HomeRoute = <Route path="/home" element={<HomeScreen />} />;
