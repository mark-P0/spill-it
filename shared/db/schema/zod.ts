import { z } from "zod";
import {
  DrizzleZodFollow,
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
  followerUserId: zodUser.shape.id,
  followingUserId: zodUser.shape.id,
});

export const zodSession: DrizzleZodSession = z.object({
  id: z.string().uuid(),
  userId: zodUser.shape.id,
  expiry: z.date(),
});
export const zodSessionWithUser = z.intersection(
  zodSession,
  z.object({
    user: zodUser,
  }),
);

export const zodPost: DrizzleZodPost = z.object({
  id: z.string().uuid(),
  userId: zodUser.shape.id,
  timestamp: z.date(),
  content: z.string(),
});
export const zodPostWithAuthor: DrizzleZodPostWithAuthor = z.intersection(
  zodPost,
  z.object({
    author: zodUser,
  }),
);
