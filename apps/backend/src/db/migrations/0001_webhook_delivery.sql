-- Outbound webhook delivery queue (partner integration, Phase 5).

CREATE TABLE "webhook_delivery" (
  "id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  "partner_id" uuid NOT NULL,
  "venue_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "status" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "next_attempt_at" timestamp DEFAULT now() NOT NULL,
  "delivered_at" timestamp,
  "last_status" integer,
  "last_error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "webhook_delivery_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE CASCADE,
  CONSTRAINT "webhook_delivery_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "venue"("id") ON DELETE CASCADE
);--> statement-breakpoint

CREATE INDEX "webhook_delivery_pending_idx" ON "webhook_delivery" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "webhook_delivery_partner_venue_idx" ON "webhook_delivery" USING btree ("partner_id","venue_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_event_type_idx" ON "webhook_delivery" USING btree ("event_type");
