import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    // Use DATABASE_URL from env, fallback to a local SQLite for development
    const dbUrl = env.databaseUrl || "mysql://root:@localhost:3306/research_accelerant";
    instance = drizzle(dbUrl, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}
