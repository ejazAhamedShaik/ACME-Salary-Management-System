import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const databaseFile = process.env.DATABASE_FILE ?? "./data/app.db";

fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const sqlite = new Database(databaseFile);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
