import { Strategy } from "passport-google-oauth20";
import { env } from "../utils/env";

/**
 * Notes:
 * - Tutorials use a direct "default export" `var GoogleStrategy = require("passport-google-oauth20")` instead of a destructured `Strategy`...
 */
export const GoogleStrategy = new Strategy(
  {
    clientID: env.AUTH_GOOGLE_CLIENT_ID,
    clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    callbackURL: "/login/google/redirect",
    scope: ["email", "profile"],
  },
  (accessToken, refreshToken, profile, done) => {}
);
