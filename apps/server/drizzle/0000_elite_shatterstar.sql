CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme_mode" varchar(10) DEFAULT 'light' NOT NULL,
	"theme_color" varchar(30) DEFAULT 'slate-indigo' NOT NULL,
	"notify_all" boolean DEFAULT true NOT NULL,
	"notify_sound" boolean DEFAULT true NOT NULL,
	"notify_preview" boolean DEFAULT true NOT NULL,
	"notify_reactions" boolean DEFAULT true NOT NULL,
	"privacy_last_seen" varchar(15) DEFAULT 'all' NOT NULL,
	"privacy_picture" varchar(15) DEFAULT 'all' NOT NULL,
	"privacy_bio" varchar(15) DEFAULT 'all' NOT NULL,
	"privacy_groups" varchar(15) DEFAULT 'all' NOT NULL,
	"privacy_read_confirmation" boolean DEFAULT true NOT NULL,
	CONSTRAINT "theme_mode_check" CHECK ("user_settings"."theme_mode" IN ('light', 'dark')),
	CONSTRAINT "privacy_last_seen_check" CHECK ("user_settings"."privacy_last_seen" IN ('all', 'contacts', 'none')),
	CONSTRAINT "privacy_picture_check" CHECK ("user_settings"."privacy_picture" IN ('all', 'contacts', 'none')),
	CONSTRAINT "privacy_bio_check" CHECK ("user_settings"."privacy_bio" IN ('all', 'contacts', 'none')),
	CONSTRAINT "privacy_groups_check" CHECK ("user_settings"."privacy_groups" IN ('all', 'contacts', 'none'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"name" varchar(100) NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"phone" varchar(32),
	"picture_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");