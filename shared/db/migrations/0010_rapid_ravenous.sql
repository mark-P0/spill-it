ALTER TABLE "posts" ADD COLUMN "userId2" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "userId2" uuid DEFAULT gen_random_uuid() NOT NULL;