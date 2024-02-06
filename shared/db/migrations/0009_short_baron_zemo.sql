ALTER TABLE "posts" RENAME COLUMN "uuid" TO "id";--> statement-breakpoint
ALTER TABLE "samples" RENAME COLUMN "uuid" TO "id";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "uuid" TO "id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "uuid" TO "id";--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_uuid_unique";--> statement-breakpoint
ALTER TABLE "samples" DROP CONSTRAINT "samples_uuid_unique";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_uuid_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_uuid_unique";--> statement-breakpoint
ALTER TABLE "posts" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "samples" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "users" ADD PRIMARY KEY ("id");