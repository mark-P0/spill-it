CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"authorId" integer NOT NULL,
	"expiry" timestamp NOT NULL
);
