import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { weekday } from "./enum";
import { promotion } from "./promotion";

export const promotionSchedule = pgTable(
  "promotion_schedule",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    promotionId: uuid("promotion_id")
      .notNull()
      .references(() => promotion.id, { onDelete: "cascade" }),
    weekday: weekday("weekday"),
    startTime: time("start_time"),
    endTime: time("end_time"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    timezone: text("timezone").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("promotion_schedule_promotion_id_idx").on(table.promotionId),
  ]
);
