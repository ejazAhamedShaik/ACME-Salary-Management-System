import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const employees = sqliteTable(
  "employees",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeCode: text("employee_code").notNull().unique(),
    name: text("name").notNull(),
    department: text("department").notNull(),
    country: text("country").notNull(),
    currencyCode: text("currency_code").notNull(),
    salaryAmount: real("salary_amount").notNull(),
    joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_employees_department").on(table.department),
    index("idx_employees_country").on(table.country),
  ],
);
