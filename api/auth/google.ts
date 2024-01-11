import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import { env } from "../utils/env";
import { randomString } from "../utils/random";

/* TODO Replace with actual database schema! */
type PlaceholderUser = {
  id: string;
  username: string;
  handleName: string;
  portraitUrl: string;
  googleId: string | null;
};
const PlaceholderUserMap = new Map<PlaceholderUser["id"], PlaceholderUser>();

function createUsernameFromHandle(handleName: string) {
  const tentativeHandle = handleName.toLowerCase().split(/\s/g).join("-"); // TODO Ensure unique from existing database entries!
  return tentativeHandle;
}

function registerPlaceholderUser(
  handleName: PlaceholderUser["handleName"],
  portraitUrl: PlaceholderUser["portraitUrl"],
  googleId: PlaceholderUser["googleId"]
) {
  const id = randomString(32);
  const user: PlaceholderUser = {
    id,
    username: createUsernameFromHandle(handleName),
    handleName,
    portraitUrl,
    googleId,
  };

  PlaceholderUserMap.set(id, user);
  return user;
}

function getPlaceholderUserById(id: PlaceholderUser["id"]) {
  return PlaceholderUserMap.get(id);
}

/**
 * Notes:
 * - Tutorials use a direct "default export" `var GoogleStrategy = require("passport-google-oauth20")` instead of a destructured `Strategy`...
 */
export const GoogleStrategy = new Strategy(
  {
    clientID: env.AUTH_GOOGLE_CLIENT_ID,
    clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    callbackURL: "/login/google/redirect",
    scope: ["profile"],
  },
  /* [Google Login] Step 5: Access actual info converted from code provided on redirect link. Must provide a "canonical" user object to `done` callback, and sessions must be available (added to Express app itself) */
  (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const handleName = profile.displayName;
    const portraitUrl = profile.photos?.[0]?.value ?? ""; // TODO Use placeholder image stored on database

    const user = registerPlaceholderUser(handleName, portraitUrl, googleId);
    done(null, user); // Needs "session support"...
  }
);

/**
 * - `user` is injected into Express by Passport
 *   - "Does not exist" in the documentation (https://expressjs.com/en/4x/api.html) but mentions it...
 * - This is apparently _the_ way to type it...
 *   - https://stackoverflow.com/a/47448486
 *   - https://github.com/DefinitelyTyped/DefinitelyTyped/blob/b2814547727b5c4cfc220af2fabe5b5da116ca96/types/express-serve-static-core/index.d.ts#L8
 *   - https://github.com/DefinitelyTyped/DefinitelyTyped/blob/b2814547727b5c4cfc220af2fabe5b5da116ca96/types/passport/index.d.ts#L8
 */
declare global {
  namespace Express {
    export interface User extends PlaceholderUser {}
  }
}
/* [Google Login] Step 6: Convert between "canonical" user representation and a serializable one (e.g. an ID sequence). The latter is used to identify sessions (e.g. cookies) */
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id: PlaceholderUser["id"], done) => {
  /**
   * Internally, Passport only checks for `null` or `false` users,
   * even if the `done` function also accepts `undefined`...
   * (probably because it is optional?)
   */
  const user = getPlaceholderUserById(id) ?? null;

  done(null, user);
});
