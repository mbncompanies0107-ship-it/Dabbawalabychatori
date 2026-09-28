import fs from "fs";
import path from "path";
import { dublinDateKey } from "./format";
import { createDatabase } from "./seed";
import type { Database } from "./types";

const globalStore = globalThis as unknown as { __miniIndiaDb?: Database };
const DB_PATH = path.join(process.cwd(), "data", "db.json");

function persist(db: Database) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const temp = `${DB_PATH}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db));
  fs.renameSync(temp, DB_PATH);
}

export function resetDatabase(): Database {
  const db = createDatabase();
  globalStore.__miniIndiaDb = db;
  persist(db);
  return db;
}

export function readDB(): Database {
  if (!globalStore.__miniIndiaDb) {
    if (fs.existsSync(DB_PATH)) {
      try {
        globalStore.__miniIndiaDb = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Database;
      } catch {
        globalStore.__miniIndiaDb = createDatabase();
        persist(globalStore.__miniIndiaDb);
      }
    } else {
      globalStore.__miniIndiaDb = createDatabase();
      persist(globalStore.__miniIndiaDb);
    }
  }
  const db = globalStore.__miniIndiaDb;
  const today = dublinDateKey();
  if (db.meta.anchorDate !== today && !db.meta.presentationLocked) {
    const fresh = createDatabase();
    globalStore.__miniIndiaDb = fresh;
    persist(fresh);
    return fresh;
  }
  return db;
}

export function updateDB<T>(mutator: (db: Database) => T): T {
  const db = readDB();
  const result = mutator(db);
  persist(db);
  return result;
}
