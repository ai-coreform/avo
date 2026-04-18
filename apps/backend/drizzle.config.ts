import "./src/utils/compression-polyfill";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required for drizzle-kit config."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/db/schema/**/*.ts"],
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
