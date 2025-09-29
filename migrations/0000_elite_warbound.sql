CREATE TABLE "crop_analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"field_area" real NOT NULL,
	"crop_type" text NOT NULL,
	"loss_percentage" real,
	"ndvi_before" real,
	"ndvi_current" real,
	"confidence" real,
	"affected_area" real,
	"estimated_value" real,
	"damage_cause" text,
	"pmfby_eligible" boolean,
	"compensation_amount" real,
	"analysis_date" timestamp DEFAULT now(),
	"satellite_images" json,
	"satellite_image_before" text,
	"satellite_image_after" text,
	"acquisition_dates" json,
	"sms_status" text DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "pmfby_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_type" text NOT NULL,
	"minimum_loss_threshold" real NOT NULL,
	"compensation_rate" real NOT NULL,
	"max_compensation" real
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"mobile" text NOT NULL,
	"email" text,
	"farm_location" text,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
ALTER TABLE "crop_analyses" ADD CONSTRAINT "crop_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");