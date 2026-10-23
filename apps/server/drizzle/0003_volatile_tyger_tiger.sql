ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
INSERT INTO "contacts" ("user_id", "contact_user_id", "created_at")
SELECT cp1.user_id, cp2.user_id, NOW()
FROM chat_participants cp1
JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id AND cp1.user_id <> cp2.user_id
JOIN chats c ON c.id = cp1.chat_id AND c.type = 'direct'
ON CONFLICT DO NOTHING;