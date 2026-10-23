CREATE TABLE "contacts" (
	"user_id" uuid NOT NULL,
	"contact_user_id" uuid NOT NULL,
	"nickname" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_user_id_contact_user_id_pk" PRIMARY KEY("user_id","contact_user_id"),
	CONSTRAINT "chk_no_self_contact" CHECK ("contacts"."user_id" <> "contacts"."contact_user_id")
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contact_user_id_users_id_fk" FOREIGN KEY ("contact_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contacts_user" ON "contacts" USING btree ("user_id");