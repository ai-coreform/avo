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
import { venue } from "./auth/venue";

export const translationJob = pgTable(
  "translation_job",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venue.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "running", "completed", "failed"],
    })
      .default("pending")
      .notNull(),
    targetLocales: jsonb("target_locales")
      .$type<string[]>()
      .default([])
      .notNull(),
    missingOnly: integer("missing_only").default(0).notNull(),
    totalUnits: integer("total_units").default(0).notNull(),
    completedUnits: integer("completed_units").default(0).notNull(),
    failedUnits: integer("failed_units").default(0).notNull(),
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
    index("translation_job_venue_id_idx").on(table.venueId),
    index("translation_job_status_idx").on(table.status),
  ]
);
