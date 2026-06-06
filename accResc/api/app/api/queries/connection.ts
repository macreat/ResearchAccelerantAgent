import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;
let client: postgres.Sql | undefined;

export function getDb() {
  if (!instance) {
    const dbUrl = env.databaseUrl || "postgres://research:research@localhost:5432/research_agent";
    client = postgres(dbUrl, { max: 10 });
    instance = drizzle(client, {
      schema: fullSchema,
    });
  }
  return instance;
}

export async function closeDb() {
  if (client) {
    await client.end();
    client = undefined;
  }
}
