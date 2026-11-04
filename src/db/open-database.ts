import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

// docs/spec/stack.md › Data and privacy: sanctions only, no message content,
// no usernames. Timestamps in ms since epoch.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS sanctions (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('warn', 'timeout', 'kick', 'ban', 'unban')),
    reason TEXT,
    duration_seconds INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sanctions_user_id ON sanctions (user_id);
`;

export function openDatabase(path: string): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}
