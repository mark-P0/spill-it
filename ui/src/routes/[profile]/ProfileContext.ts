import { UserPublic } from "@spill-it/db/schema/drizzle";
import { raise } from "@spill-it/utils/errors";
import { createContext, useContext } from "react";

type ProfileValue = {
  profile: UserPublic;
};
export const ProfileContext = createContext<ProfileValue | null>(null);

export function useProfileContext() {
  return (
    useContext(ProfileContext) ?? raise("Profile context possibly not provided")
  );
}
