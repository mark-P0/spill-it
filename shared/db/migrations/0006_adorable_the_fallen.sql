CREATE TABLE IF NOT EXISTS "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"content" text NOT NULL
);
