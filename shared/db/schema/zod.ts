import { z } from "zod";
import {
  DrizzleZodFollow,
  DrizzleZodFollowWithUsers,
  DrizzleZodPost,
  DrizzleZodPostWithAuthor,
  DrizzleZodSample,
  DrizzleZodSession,
  DrizzleZodSessionWithUser,
  DrizzleZodUser,
  DrizzleZodUserPublic,
  DrizzleZodUserPublicDetails,
  Sample,
} from "./drizzle";

export const zodSample: DrizzleZodSample = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  phone: z.string().nullable(),
});
{
  (sample: Sample) => sample satisfies z.infer<typeof zodSample>;
}

export const zodUser: DrizzleZodUser = z.object({
  id: z.string().uuid(),
  registrationDate: z.date(),
  username: z.string(),
  handleName: z.string(),
  portraitUrl: z.string().url(),
  bio: z.string(),
  isPrivate: z.boolean(),
  googleId: z.string().nullable(),
  loginCt: z.number(),
});
export const zodUserPublic: DrizzleZodUserPublic = zodUser.pick({
  id: true,
  registrationDate: true,
  username: true,
  handleName: true,
  portraitUrl: true,
  bio: true,
  isPrivate: true,
  // googleId: true,
  loginCt: true,
});
export const zodUserPublicDetails: DrizzleZodUserPublicDetails = zodUser
  .pick({
    // id: true,
    // registrationDate: true,
    username: true,
    handleName: true,
    portraitUrl: true,
    bio: true,
    isPrivate: true,
    // googleId: true,
    // loginCt: true,
  })
  .partial();

export const zodFollow: DrizzleZodFollow = z.object({
  id: z.string().uuid(),
  date: z.date(),
  followerUserId: zodUserPublic.shape.id,
  followingUserId: zodUserPublic.shape.id,
});
export const zodFollowWithUsers: DrizzleZodFollowWithUsers = zodFollow.extend({
  follower: zodUserPublic,
  following: zodUserPublic,
});
export const zodFollowers = zodFollowWithUsers.pick({
  // id: true,
  date: true,
  // followerUserId: true,
  // followingUserId: true,
  follower: true,
});
export type Follower = z.infer<typeof zodFollowers>;
export const zodFollowings = zodFollowWithUsers.pick({
  // id: true,
  date: true,
  // followerUserId: true,
  // followingUserId: true,
  following: true,
});
export type Following = z.infer<typeof zodFollowings>;

export const zodUserPublicWithFollowDate = z.object({
  date: zodFollow.shape.date,
  user: zodUserPublic,
});
export const zodUserPublicWithFollows = zodUserPublic.extend({
  followers: z.array(zodFollowers),
  followings: z.array(zodFollowings),
});
export type UserPublicWithFollows = z.infer<typeof zodUserPublicWithFollows>;

export const zodSession: DrizzleZodSession = z.object({
  id: z.string().uuid(),
  userId: zodUserPublic.shape.id,
  expiry: z.date(),
});
export const zodSessionWithUser: DrizzleZodSessionWithUser = zodSession.extend({
  user: zodUserPublic,
});

export const zodPost: DrizzleZodPost = z.object({
  id: z.string().uuid(),
  userId: zodUserPublic.shape.id,
  timestamp: z.date(),
  content: z.string(),
});
export const zodPostWithAuthor: DrizzleZodPostWithAuthor = zodPost.extend({
  author: zodUserPublic,
});
