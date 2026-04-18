import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { role } from "./enums";

export const USER_STATUS_VALUES = [
  "active",
  "pending_claim",
  "abandoned",
] as const;

export type UserStatus = (typeof USER_STATUS_VALUES)[number];

export const user = pgTable("user", {
  id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneNumber: text("phone_number"),
  image: text("image"),
  role: role("role"),
  /**
   * Account lifecycle status.
   * - `active`: normal, claimed account.
   * - `pending_claim`: provisioned by a partner, awaiting claim by the owner.
   * - `abandoned`: pending_claim expired without being claimed.
   */
  status: text("status").$type<UserStatus>().default("active").notNull(),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  tosAcceptedAt: timestamp("tos_accepted_at"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});
