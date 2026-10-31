CREATE TABLE IF NOT EXISTS "blocked_users" (
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_users_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id"),
	CONSTRAINT "chk_no_self_block" CHECK ("blocked_users"."blocker_id" <> "blocked_users"."blocked_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blocked_users_blocker" ON "blocked_users" USING btree ("blocker_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blocked_users_blocked" ON "blocked_users" USING btree ("blocked_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
