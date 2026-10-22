import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export * from "./schema.js";
export * from "./migrate.js";

export function createDb(pool: pg.Pool) {
  return drizzle(pool, { schema });
}
