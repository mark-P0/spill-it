ALTER TABLE "posts" RENAME COLUMN "userId2" TO "userId";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "userId2" TO "userId";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "userId" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "userId" DROP DEFAULT;