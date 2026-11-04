import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "./open-database.js";

let dir: string;
const opened: DatabaseSync[] = [];

function open(path: string): DatabaseSync {
  const db = openDatabase(path);
  opened.push(db);
  return db;
}

function names(db: DatabaseSync, type: string): unknown[] {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = ? ORDER BY name")
    .all(type)
    .map((row) => row.name);
}

function insertSanction(db: DatabaseSync, type: string): void {
  db.prepare(
    "INSERT INTO sanctions (user_id, moderator_id, type, created_at) VALUES (?, ?, ?, ?)",
  ).run("1", "2", type, 0);
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "pitlane-db-"));
});

afterEach(() => {
  for (const db of opened.splice(0)) db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("openDatabase", () => {
  it("creates the file and its missing parent directories", () => {
    const path = join(dir, "nested", "deeper", "bot.db");

    open(path);

    expect(existsSync(path)).toBe(true);
  });

  it("creates the sanctions table and its user index", () => {
    const db = open(join(dir, "bot.db"));

    expect(names(db, "table")).toContain("sanctions");
    expect(names(db, "index")).toContain("sanctions_user_id");
  });

  it("is idempotent and keeps existing rows", () => {
    const path = join(dir, "bot.db");
    const first = open(path);
    insertSanction(first, "warn");

    const second = open(path);

    expect(second.prepare("SELECT COUNT(*) AS n FROM sanctions").get()).toEqual(
      {
        n: 1,
      },
    );
  });

  it.each(["warn", "timeout", "kick", "ban", "unban"])(
    "accepts the %s sanction type",
    (type) => {
      const db = open(join(dir, "bot.db"));

      expect(() => {
        insertSanction(db, type);
      }).not.toThrow();
    },
  );

  it("rejects an unknown sanction type", () => {
    const db = open(join(dir, "bot.db"));

    expect(() => {
      insertSanction(db, "mute");
    }).toThrow(/CHECK constraint/);
  });
});
