import { faker } from "@faker-js/faker";
import { pathToFileURL } from "node:url";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { employees } from "./schema.js";

const SEED = 20260706;
const TOTAL_EMPLOYEES = 10_000;
const BATCH_SIZE = 500;

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Finance", "Human Resources", "Operations"];

const COUNTRIES: Array<{ country: string; currencyCode: string }> = [
  { country: "United States", currencyCode: "USD" },
  { country: "United Kingdom", currencyCode: "GBP" },
  { country: "Germany", currencyCode: "EUR" },
  { country: "India", currencyCode: "INR" },
  { country: "Canada", currencyCode: "CAD" },
  { country: "Australia", currencyCode: "AUD" },
];

function buildEmployee(index: number) {
  const { country, currencyCode } = faker.helpers.arrayElement(COUNTRIES);

  return {
    employeeCode: `EMP-${String(index).padStart(6, "0")}`,
    name: faker.person.fullName(),
    department: faker.helpers.arrayElement(DEPARTMENTS),
    country,
    currencyCode,
    salaryAmount: faker.number.int({ min: 35_000, max: 220_000 }),
    joinedAt: faker.date.past({ years: 8 }),
  };
}

export function seedDatabase(db: BetterSQLite3Database<Record<string, unknown>>): number {
  faker.seed(SEED);

  db.transaction((tx) => {
    for (let batchStart = 1; batchStart <= TOTAL_EMPLOYEES; batchStart += BATCH_SIZE) {
      const batch = Array.from({ length: BATCH_SIZE }, (_, offset) =>
        buildEmployee(batchStart + offset),
      );
      tx.insert(employees).values(batch).run();
    }
  });

  return TOTAL_EMPLOYEES;
}

const isEntryPoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const { db } = await import("./client.js");
  migrate(db, { migrationsFolder: "./drizzle" });
  const count = seedDatabase(db);
  console.log(`Seeded ${count} employees.`);
}
