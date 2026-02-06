ALTER TABLE "toil_events" ADD COLUMN "status" text DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "toil_events" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "toil_events" ADD COLUMN "approval_timestamp" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;