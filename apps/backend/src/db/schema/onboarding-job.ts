import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const onboardingJob = pgTable(
  "onboarding_job",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    status: text("status", {
      enum: ["pending", "running", "completed", "failed"],
    })
      .default("pending")
      .notNull(),
    restaurantName: text("restaurant_name").notNull(),
    slug: text("slug").notNull(),
    websiteUrl: text("website_url").notNull(),
    createdBy: uuid("created_by").notNull(),
    venueId: uuid("venue_id"),
    venueSlug: text("venue_slug"),
    result: jsonb("result").$type<{
      categoryCount: number;
      groupCount: number;
      itemCount: number;
    }>(),
    currentStep: text("current_step"),
    totalSteps: integer("total_steps").default(5).notNull(),
    completedSteps: integer("completed_steps").default(0).notNull(),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("onboarding_job_status_idx").on(table.status),
    index("onboarding_job_created_by_idx").on(table.createdBy),
  ]
);
