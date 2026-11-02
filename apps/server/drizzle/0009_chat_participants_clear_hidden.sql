ALTER TABLE "chat_participants" ADD COLUMN IF NOT EXISTS "cleared_at" timestamp with time zone;
ALTER TABLE "chat_participants" ADD COLUMN IF NOT EXISTS "hidden_at" timestamp with time zone;
