CREATE TABLE IF NOT EXISTS "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"followerUserId" uuid NOT NULL,
	"followingUserId" uuid NOT NULL
);
