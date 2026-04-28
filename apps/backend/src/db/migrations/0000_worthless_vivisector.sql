CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."menu_additive" AS ENUM('colorants', 'preservatives', 'antioxidants', 'flavor_enhancers', 'sulfide', 'smoked', 'waxed', 'sweetener', 'aspartame', 'phenylalanine', 'phosphate', 'caffeine', 'quinine');--> statement-breakpoint
CREATE TYPE "public"."menu_allergen" AS ENUM('gluten', 'crustaceans', 'egg', 'fish', 'peanut', 'soy', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulfites', 'lupins', 'shellfish');--> statement-breakpoint
CREATE TYPE "public"."menu_entry_kind" AS ENUM('entry', 'group');--> statement-breakpoint
CREATE TYPE "public"."menu_feature" AS ENUM('frozen', 'gluten_free', 'blast_chilled', 'spicy', 'vegetarian', 'vegan', 'lactose_free', 'organic', 'halal', 'new', 'recommended');--> statement-breakpoint
CREATE TYPE "public"."menu_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."translated_by" AS ENUM('manual', 'system');--> statement-breakpoint
CREATE TYPE "public"."translation_entity_type" AS ENUM('menu', 'menu_tab', 'menu_category', 'menu_entry', 'menu_subcategory', 'catalog_item', 'promotion', 'promotion_component');--> statement-breakpoint
CREATE TYPE "public"."translation_status" AS ENUM('draft', 'published', 'stale');--> statement-breakpoint
CREATE TYPE "public"."weekday" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"team_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"inviter_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	"active_venue_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_number" text,
	"image" text,
	"role" "role",
	"status" text DEFAULT 'active' NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"tos_accepted_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venue" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"timezone" text DEFAULT 'Europe/Rome' NOT NULL,
	"default_locale" text DEFAULT 'it' NOT NULL,
	"source_locale" text DEFAULT 'it' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active_menu_id" uuid,
	"socials" jsonb,
	"address" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"region" text,
	"postal_code" text,
	"country" text,
	"country_code" text,
	"place_id" text,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "venue_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_item" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price_cents" integer,
	"price_label" text,
	"allergens" "menu_allergen"[] DEFAULT '{}'::menu_allergen[] NOT NULL,
	"features" "menu_feature"[] DEFAULT '{}'::menu_feature[] NOT NULL,
	"additives" "menu_additive"[] DEFAULT '{}'::menu_additive[] NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"source_revision" integer DEFAULT 1 NOT NULL,
	"external_id" text,
	"external_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_token" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"venue_link_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_translation" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"entity_type" "translation_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"fields_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_locale" text NOT NULL,
	"source_revision" integer NOT NULL,
	"status" "translation_status" DEFAULT 'published' NOT NULL,
	"translated_by" "translated_by" DEFAULT 'system' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_category" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"tab_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_revision" integer DEFAULT 1 NOT NULL,
	"external_id" text,
	"external_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_entry" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"kind" "menu_entry_kind" DEFAULT 'entry' NOT NULL,
	"title" text,
	"catalog_item_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"price_cents_override" integer,
	"price_label_override" text,
	"external_id" text,
	"external_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_tab" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"label" text NOT NULL,
	"slug" text NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_revision" integer DEFAULT 1 NOT NULL,
	"external_id" text,
	"external_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "menu_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"theme" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_revision" integer DEFAULT 1 NOT NULL,
	"external_id" text,
	"external_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_job" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"restaurant_name" text NOT NULL,
	"slug" text NOT NULL,
	"website_url" text NOT NULL,
	"created_by" uuid NOT NULL,
	"venue_id" uuid,
	"venue_slug" text,
	"result" jsonb,
	"current_step" text,
	"total_steps" integer DEFAULT 5 NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_idempotency_key" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"key" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"response_status" integer NOT NULL,
	"response_body" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"api_key_hash" text NOT NULL,
	"api_key_hash_previous" text,
	"api_key_previous_expires_at" timestamp,
	"webhook_url" text NOT NULL,
	"webhook_secret" text NOT NULL,
	"ip_allowlist" text[] DEFAULT '{}'::text[] NOT NULL,
	"feature_flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_component" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"promotion_id" uuid NOT NULL,
	"catalog_item_id" uuid,
	"display_name" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_schedule" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"promotion_id" uuid NOT NULL,
	"weekday" "weekday",
	"start_time" time,
	"end_time" time,
	"start_date" date,
	"end_date" date,
	"timezone" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"short_description" text NOT NULL,
	"long_description" text,
	"promo_price" double precision NOT NULL,
	"original_price" double precision,
	"image_url" text,
	"badge_label" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translation_job" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"target_locales" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"missing_only" integer DEFAULT 0 NOT NULL,
	"total_units" integer DEFAULT 0 NOT NULL,
	"completed_units" integer DEFAULT 0 NOT NULL,
	"failed_units" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploaded_file" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_link" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"link_token" text NOT NULL,
	"connect_venue_id" text NOT NULL,
	"status" text NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"disconnected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_locale" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
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
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_item" ADD CONSTRAINT "catalog_item_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_token" ADD CONSTRAINT "claim_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_token" ADD CONSTRAINT "claim_token_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_token" ADD CONSTRAINT "claim_token_venue_link_id_venue_link_id_fk" FOREIGN KEY ("venue_link_id") REFERENCES "public"."venue_link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_translation" ADD CONSTRAINT "content_translation_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category" ADD CONSTRAINT "menu_category_menu_id_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category" ADD CONSTRAINT "menu_category_tab_id_menu_tab_id_fk" FOREIGN KEY ("tab_id") REFERENCES "public"."menu_tab"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_entry" ADD CONSTRAINT "menu_entry_menu_id_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_entry" ADD CONSTRAINT "menu_entry_category_id_menu_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_entry" ADD CONSTRAINT "menu_entry_catalog_item_id_catalog_item_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_tab" ADD CONSTRAINT "menu_tab_menu_id_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_idempotency_key" ADD CONSTRAINT "partner_idempotency_key_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_component" ADD CONSTRAINT "promotion_component_promotion_id_promotion_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_component" ADD CONSTRAINT "promotion_component_catalog_item_id_catalog_item_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_schedule" ADD CONSTRAINT "promotion_schedule_promotion_id_promotion_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_menu_id_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation_job" ADD CONSTRAINT "translation_job_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_file" ADD CONSTRAINT "uploaded_file_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_link" ADD CONSTRAINT "venue_link_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_link" ADD CONSTRAINT "venue_link_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_locale" ADD CONSTRAINT "venue_locale_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_venueId_idx" ON "invitation" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_venueId_idx" ON "member" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "catalog_item_venue_id_idx" ON "catalog_item" USING btree ("venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_item_venue_slug_idx" ON "catalog_item" USING btree ("venue_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_item_external_uniq" ON "catalog_item" USING btree ("venue_id","external_source","external_id") WHERE external_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "claim_token_expires_at_idx" ON "claim_token" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "claim_token_venue_link_id_idx" ON "claim_token" USING btree ("venue_link_id");--> statement-breakpoint
CREATE INDEX "content_translation_venue_id_idx" ON "content_translation" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "content_translation_entity_idx" ON "content_translation" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_translation_entity_locale_idx" ON "content_translation" USING btree ("entity_type","entity_id","locale");--> statement-breakpoint
CREATE INDEX "menu_category_menu_id_idx" ON "menu_category" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "menu_category_tab_id_idx" ON "menu_category" USING btree ("tab_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_category_menu_slug_idx" ON "menu_category" USING btree ("menu_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_category_external_uniq" ON "menu_category" USING btree ("menu_id","external_source","external_id") WHERE external_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "menu_entry_menu_id_idx" ON "menu_entry" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "menu_entry_category_id_idx" ON "menu_entry" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "menu_entry_catalog_item_id_idx" ON "menu_entry" USING btree ("catalog_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_entry_external_uniq" ON "menu_entry" USING btree ("menu_id","external_source","external_id") WHERE external_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "menu_tab_menu_id_idx" ON "menu_tab" USING btree ("menu_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_tab_menu_slug_idx" ON "menu_tab" USING btree ("menu_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_tab_external_uniq" ON "menu_tab" USING btree ("menu_id","external_source","external_id") WHERE external_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "menu_venue_id_idx" ON "menu" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "menu_status_idx" ON "menu" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_venue_slug_uniq" ON "menu" USING btree ("venue_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_external_uniq" ON "menu" USING btree ("venue_id","external_source","external_id") WHERE external_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "onboarding_job_status_idx" ON "onboarding_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "onboarding_job_created_by_idx" ON "onboarding_job" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_idempotency_key_partner_key_uniq" ON "partner_idempotency_key" USING btree ("partner_id","key");--> statement-breakpoint
CREATE INDEX "partner_idempotency_key_expires_at_idx" ON "partner_idempotency_key" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_slug_uniq" ON "partner" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "promotion_component_promotion_id_idx" ON "promotion_component" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "promotion_component_catalog_item_id_idx" ON "promotion_component" USING btree ("catalog_item_id");--> statement-breakpoint
CREATE INDEX "promotion_schedule_promotion_id_idx" ON "promotion_schedule" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "promotion_menu_id_idx" ON "promotion" USING btree ("menu_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promotion_menu_slug_idx" ON "promotion" USING btree ("menu_id","slug");--> statement-breakpoint
CREATE INDEX "translation_job_venue_id_idx" ON "translation_job" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "translation_job_status_idx" ON "translation_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "uploaded_file_venue_id_idx" ON "uploaded_file" USING btree ("venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venue_link_partner_venue_uniq" ON "venue_link" USING btree ("partner_id","venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venue_link_token_uniq" ON "venue_link" USING btree ("link_token");--> statement-breakpoint
CREATE UNIQUE INDEX "venue_link_partner_connect_venue_uniq" ON "venue_link" USING btree ("partner_id","connect_venue_id");--> statement-breakpoint
CREATE INDEX "venue_link_status_idx" ON "venue_link" USING btree ("status");--> statement-breakpoint
CREATE INDEX "venue_locale_venue_id_idx" ON "venue_locale" USING btree ("venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venue_locale_venue_locale_idx" ON "venue_locale" USING btree ("venue_id","locale");--> statement-breakpoint
CREATE INDEX "webhook_delivery_pending_idx" ON "webhook_delivery" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "webhook_delivery_partner_venue_idx" ON "webhook_delivery" USING btree ("partner_id","venue_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_event_type_idx" ON "webhook_delivery" USING btree ("event_type");