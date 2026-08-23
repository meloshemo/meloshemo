CREATE TYPE "public"."poll_status" AS ENUM('draft', 'scheduled', 'live', 'closed', 'archived');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "abuse_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"ip_hash" "bytea",
	"asn" integer,
	"poll_id" uuid,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name_tr" text NOT NULL,
	"name_en" text,
	"emoji" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cities" (
	"id" smallint PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"population" integer NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_tr" text NOT NULL,
	"name_en" text,
	"category_id" smallint,
	"emoji" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "entities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"entity_id" uuid,
	"label_tr" text NOT NULL,
	"label_en" text,
	"emoji" text,
	"position" smallint NOT NULL,
	CONSTRAINT "options_poll_position_uq" UNIQUE("poll_id","position")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"question_tr" text NOT NULL,
	"question_en" text,
	"category_id" smallint NOT NULL,
	"status" "poll_status" DEFAULT 'draft' NOT NULL,
	"scope_city_id" smallint,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"sponsor_id" uuid,
	"seo_title" text,
	"seo_description" text,
	"share_text" text,
	"editorial_ok" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "polls_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shares" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"poll_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"website" text,
	"disclosure_tr" text DEFAULT 'Sponsorlu içerik' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trending" (
	"option_id" uuid PRIMARY KEY NOT NULL,
	"poll_id" uuid NOT NULL,
	"delta_24h" numeric(5, 2) NOT NULL,
	"score" numeric(10, 4) NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote_aggregates" (
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"city_id" smallint DEFAULT 0 NOT NULL,
	"vote_count" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vote_aggregates_poll_id_option_id_city_id_pk" PRIMARY KEY("poll_id","option_id","city_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote_timeseries" (
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"bucket" timestamp with time zone NOT NULL,
	"vote_count" integer NOT NULL,
	CONSTRAINT "vote_timeseries_poll_id_option_id_bucket_pk" PRIMARY KEY("poll_id","option_id","bucket")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "votes" (
	"id" bigserial,
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"city_id" smallint,
	"session_hash" "bytea" NOT NULL,
	"ip_hash" "bytea" NOT NULL,
	"asn" integer,
	"country" char(2),
	"trust_score" smallint DEFAULT 100 NOT NULL,
	"is_counted" boolean DEFAULT true NOT NULL,
	"ua_class" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_poll_session_uq" UNIQUE("poll_id","session_hash")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "entities" ADD CONSTRAINT "entities_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "options" ADD CONSTRAINT "options_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "options" ADD CONSTRAINT "options_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "polls" ADD CONSTRAINT "polls_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "polls" ADD CONSTRAINT "polls_scope_city_id_cities_id_fk" FOREIGN KEY ("scope_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "polls" ADD CONSTRAINT "polls_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "polls_status_starts_idx" ON "polls" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "polls_category_idx" ON "polls" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "votes_poll_created_idx" ON "votes" USING btree ("poll_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "votes_ip_created_idx" ON "votes" USING btree ("ip_hash","created_at");