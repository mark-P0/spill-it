/**
 * Largely based on
 * https://www.youtube.com/playlist?list=PL4cUxeGkcC9jdm7QX143aMLAqyM-jTZ2x
 */

import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import {
  User as DBUser,
  createUserFromGoogle,
  readGoogleUser,
  readUser,
  updateIncrementGoogleUserLoginCt,
} from "../data/users";
import { env } from "../utils/env";
import { endpoints } from "../utils/express";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(import.meta.url);

/**
 * Notes:
 * - Tutorials use a direct "default export" `var GoogleStrategy = require("passport-google-oauth20")` instead of a destructured `Strategy`...
 */
export const GoogleStrategy = new Strategy(
  {
    clientID: env.AUTH_GOOGLE_CLIENT_ID,
    clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    callbackURL: endpoints.api.v0.login.google.redirect,
    scope: ["profile"],
  },
  /* [Google Login] Step 5: Access actual info converted from code provided on redirect link. Must provide a "canonical" user object to `done` callback, and sessions must be available (added to Express app itself) */
  async (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const handleName = profile.displayName;
    const portraitUrl = profile.photos?.[0]?.value ?? ""; // TODO Use placeholder image stored on database

    logger.info(`Fetching info of Google user "${googleId}"`);
    let user = await readGoogleUser(googleId);
    if (user === null) {
      logger.info(`Google user "${googleId}" does not exist; creating...`);
      user = await createUserFromGoogle(googleId, handleName, portraitUrl);
    }
    {
      logger.info(`Incrementing login count for Google user ${googleId}`);
      logger.warn("Login count separately incremented!"); // TODO There must be a better way...

      updateIncrementGoogleUserLoginCt(googleId);
      user.loginCt += 1;
    }

    logger.debug(`Submitting info of Google user ${googleId} into sessions(?)`);
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
    export interface User extends DBUser {}
  }
}
/* [Google Login] Step 6: Convert between "canonical" user representation and a serializable one (e.g. an ID sequence). The latter is used to identify sessions (e.g. cookies) */
passport.serializeUser((user, done) => {
  logger.debug(`Serializing user into "${user.id}"`);
  done(null, user.id);
});
passport.deserializeUser(async (id: DBUser["id"], done) => {
  logger.debug(`Deserializing "${id}" into user`);

  /**
   * Internally, Passport only checks for `null` or `false` users,
   * even if the `done` function also accepts `undefined`...
   * (probably because it is optional?)
   */
  const user = (await readUser(id)) ?? null;
  if (user === null) {
    logger.warn(`User "${id}" does not exist!`);
  }

  done(null, user);
});
