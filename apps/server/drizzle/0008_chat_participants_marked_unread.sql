ALTER TABLE "chat_participants" ADD COLUMN IF NOT EXISTS "marked_unread" boolean DEFAULT false NOT NULL;
