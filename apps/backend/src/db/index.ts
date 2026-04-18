import { drizzle } from "drizzle-orm/bun-sql";
import schema from "./schema";

const database = drizzle(process.env.DATABASE_URL, {
  schema,
});

export default database;
