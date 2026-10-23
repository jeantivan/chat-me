CREATE TABLE "chat_participants" (
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(10) DEFAULT 'member' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"muted" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_participants_chat_id_user_id_pk" PRIMARY KEY("chat_id","user_id"),
	CONSTRAINT "participant_role_check" CHECK ("chat_participants"."role" IN ('admin', 'member'))
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(10) NOT NULL,
	"title" varchar(150),
	"picture_url" text,
	"direct_pair_hash" varchar(73),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chats_direct_pair_hash_unique" UNIQUE("direct_pair_hash"),
	CONSTRAINT "chat_type_check" CHECK ("chats"."type" IN ('direct', 'group'))
);
--> statement-breakpoint
CREATE TABLE "message_receipts" (
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(10) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_receipts_message_id_user_id_pk" PRIMARY KEY("message_id","user_id"),
	CONSTRAINT "receipt_status_check" CHECK ("message_receipts"."status" IN ('received', 'read'))
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"forwarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_participants_user" ON "chat_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_receipts_user" ON "message_receipts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_messages_chat_created" ON "messages" USING btree ("chat_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");