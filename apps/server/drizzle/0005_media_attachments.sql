CREATE TABLE IF NOT EXISTS "media_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid,
	"chat_id" uuid NOT NULL,
	"uploader_id" uuid NOT NULL,
	"type" varchar(15) NOT NULL,
	"url" text NOT NULL,
	"storage_key" text NOT NULL,
	"blurhash" varchar(64),
	"orientation" varchar(10),
	"duration" integer,
	"width" integer,
	"height" integer,
	"size_bytes" bigint NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_attachments_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "media_type_check" CHECK ("type" IN ('image', 'video', 'audio', 'document')),
	CONSTRAINT "media_orientation_check" CHECK ("orientation" IS NULL OR "orientation" IN ('square', 'landscape', 'portrait')),
	CONSTRAINT "media_status_check" CHECK ("status" IN ('pending', 'uploaded', 'attached', 'expired'))
);

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "media_id" uuid;

DO $$ BEGIN
 ALTER TABLE "media_attachments" ADD CONSTRAINT "media_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media_attachments" ADD CONSTRAINT "media_attachments_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media_attachments" ADD CONSTRAINT "media_attachments_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_media_id_media_attachments_id_fk" FOREIGN KEY ("media_id") REFERENCES "media_attachments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_media_message" ON "media_attachments" ("message_id");
CREATE INDEX IF NOT EXISTS "idx_media_chat" ON "media_attachments" ("chat_id");
CREATE INDEX IF NOT EXISTS "idx_media_pending" ON "media_attachments" ("status", "created_at") WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS "idx_messages_media" ON "messages" ("media_id");
