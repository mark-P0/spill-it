CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"handleName" text NOT NULL,
	"portraitUrl" text NOT NULL,
	"googleId" text
);
