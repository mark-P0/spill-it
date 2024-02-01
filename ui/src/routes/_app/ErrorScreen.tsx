import { useRouteError } from "react-router-dom";
import { Screen } from "../../components/Screen";

export function ErrorScreen() {
  const error = useRouteError();
  console.error(error);

  return (
    <Screen className="grid place-items-center">
      Sorry! We spilt too much. Please try again!
    </Screen>
  );
}
