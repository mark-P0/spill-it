ALTER TABLE "follows" RENAME COLUMN "_id" TO "id";--> statement-breakpoint
ALTER TABLE "follows" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "follows" ALTER COLUMN "id" SET NOT NULL;