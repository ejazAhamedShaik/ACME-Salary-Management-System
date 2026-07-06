import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { employees } from "./schema.js";
import { seedDatabase } from "./seed.js";

export function bootstrap(db: BetterSQLite3Database<Record<string, unknown>>): void {
  migrate(db, { migrationsFolder: "./drizzle" });

  const [{ count }] = db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .all();

  if (count === 0) {
    const seeded = seedDatabase(db);
    console.log(`Database was empty — seeded ${seeded} employees.`);
  } else {
    console.log(`Database already has ${count} employees — skipping seed.`);
  }
}
