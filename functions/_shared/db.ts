/**
 * Database connection utility for Cloudflare Workers
 * Creates a Drizzle instance using the DATABASE_URL from environment
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export interface Env {
  DATABASE_URL: string;
  SESSION_SECRET: string;
}

/**
 * Create a database connection for the current request
 * Must be called with env from the request context
 */
export function createDb(env: Env) {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

