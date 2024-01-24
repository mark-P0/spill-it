import { Route } from "react-router-dom";
import { endpoint } from "../utils/endpoints";

function HomeScreen() {
  return (
    <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
      Home page
    </main>
  );
}

export const HomeRoute = () => (
  <Route path={endpoint("/home")} element={<HomeScreen />} />
);
