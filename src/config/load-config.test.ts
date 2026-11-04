import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validConfig } from "../test-support/config.js";
import { ConfigError } from "./config-error.js";
import { loadConfig } from "./load-config.js";
import { configSchema } from "./schema.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "pitlane-config-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(content: unknown, name = "config.json"): string {
  const path = join(dir, name);
  writeFileSync(
    path,
    typeof content === "string" ? content : JSON.stringify(content),
  );
  return path;
}

function captureError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("loadConfig", () => {
  it("loads a valid config", () => {
    const config = validConfig();

    expect(loadConfig(write(config))).toEqual(config);
  });

  it("throws a ConfigError when the file cannot be read", () => {
    const path = join(dir, "missing.json");

    expect(() => loadConfig(path)).toThrow(ConfigError);
    expect(() => loadConfig(path)).toThrow(`Cannot read config ${path}`);
  });

  it("throws a ConfigError when the file is not JSON", () => {
    expect(() => loadConfig(write("{ nope"))).toThrow(/Cannot read config/);
  });

  it.each([["[]"], ["null"]])(
    "reports (root) for a file containing %s",
    (raw) => {
      expect(() => loadConfig(write(raw))).toThrow(/\(root\):/);
    },
  );

  it("names the field of a threshold out of range", () => {
    const config = validConfig();
    config.thresholds.scamTimeoutMinutes = 28 * 24 * 60 + 1;

    expect(() => loadConfig(write(config))).toThrow(
      /thresholds\.scamTimeoutMinutes/,
    );
  });

  it("rejects an unknown key", () => {
    const config = { ...validConfig(), extra: true };

    expect(() => loadConfig(write(config))).toThrow(/extra/);
  });

  it("rejects an invalid channel visibility", () => {
    const config = { ...validConfig() } as Record<string, unknown>;
    const channels = validConfig().channels;
    config.channels = {
      ...channels,
      rules: { ...channels.rules, visibility: "secret" },
    };

    expect(() => loadConfig(write(config))).toThrow(
      /channels\.rules\.visibility/,
    );
  });

  it("rejects a malformed Discord id", () => {
    const config = validConfig();
    config.staffRole.id = "abc";

    expect(() => loadConfig(write(config))).toThrow(
      /staffRole\.id: must be a Discord id/,
    );
  });

  it("rejects an empty guildId", () => {
    const config = validConfig();
    config.guildId = "";

    expect(() => loadConfig(write(config))).toThrow(/guildId: missing id/);
  });

  it("lists every empty id", () => {
    const config = validConfig();
    config.staffRole.id = "";
    config.statusRoles.sponsor.id = "";
    config.channels.modLog.id = "";
    config.roleCatalog = config.roleCatalog.map((entry, index) =>
      index === 1 ? { ...entry, role: { ...entry.role, id: "" } } : entry,
    );

    const error = captureError(() => loadConfig(write(config)));

    expect(error).toBeInstanceOf(ConfigError);
    const message = (error as ConfigError).message;
    expect(message).toContain("staffRole.id: missing id");
    expect(message).toContain("statusRoles.sponsor.id: missing id");
    expect(message).toContain("channels.modLog.id: missing id");
    expect(message).toContain("roleCatalog.1.role.id: missing id");
    expect(message).not.toContain("guildId");
  });

  describe.each(["development", "production"])("shipped %s config", (name) => {
    const path = join(process.cwd(), "config", `${name}.json`);

    it("matches the schema", async () => {
      const { readFileSync } = await import("node:fs");
      const raw: unknown = JSON.parse(readFileSync(path, "utf8"));

      expect(configSchema.safeParse(raw).success).toBe(true);
    });
  });
});
