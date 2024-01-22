import { Route } from "react-router-dom";

function HomeScreen() {
  return (
    <main className="h-screen w-screen grid place-items-center bg-stone-700 text-white">
      Home page
    </main>
  );
}
export const HomeRoute = <Route path="/home" element={<HomeScreen />} />;
