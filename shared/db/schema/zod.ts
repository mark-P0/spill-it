import { z } from "zod";
import {
  DrizzleZodFollow,
  DrizzleZodFollowWithUsers,
  DrizzleZodPost,
  DrizzleZodPostWithAuthor,
  DrizzleZodSample,
  DrizzleZodSession,
  DrizzleZodUser,
  DrizzleZodUserPublic,
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
  username: z.string(),
  handleName: z.string(),
  portraitUrl: z.string(),
  googleId: z.string().nullable(),
  loginCt: z.number(),
});

export const zodUserPublic: DrizzleZodUserPublic = zodUser.pick({
  id: true,
  username: true,
  handleName: true,
  portraitUrl: true,
  // googleId: true,
  loginCt: true,
});

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
  date: true,
  follower: true,
});
export type Follower = z.infer<typeof zodFollowers>;

export const zodUserPublicWithFollowDate = z.object({
  date: zodFollow.shape.date,
  user: zodUserPublic,
});
export const zodUserPublicWithFollows = zodUserPublic.extend({
  followers: z.array(zodFollowers),
  followings: z.array(
    zodFollowWithUsers.pick({
      date: true,
      following: true,
    }),
  ),
});
export type UserPublicWithFollows = z.infer<typeof zodUserPublicWithFollows>;

export const zodSession: DrizzleZodSession = z.object({
  id: z.string().uuid(),
  userId: zodUserPublic.shape.id,
  expiry: z.date(),
});
export const zodSessionWithUser = z.intersection(
  zodSession,
  z.object({
    user: zodUserPublic,
  }),
);

export const zodPost: DrizzleZodPost = z.object({
  id: z.string().uuid(),
  userId: zodUserPublic.shape.id,
  timestamp: z.date(),
  content: z.string(),
});
export const zodPostWithAuthor: DrizzleZodPostWithAuthor = z.intersection(
  zodPost,
  z.object({
    author: zodUserPublic,
  }),
);
