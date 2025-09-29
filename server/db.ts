import "dotenv/config"; // ✅ ensures env vars are loaded if not already
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// ✅ Mask the password before logging
function maskDatabaseUrl(url: string | undefined): string {
  if (!url) return "undefined";
  return url.replace(/:\/\/(.*):(.*)@/, "://$1:****@");
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not set in your .env file");
  process.exit(1);
} else {
  console.log("✅ Loaded DATABASE_URL:", maskDatabaseUrl(databaseUrl));
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool);
