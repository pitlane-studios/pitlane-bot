import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigError } from "./config-error.js";
import { loadEnv } from "./env.js";

const TOKEN = "super-secret-token-value";

function validEnv(): NodeJS.ProcessEnv {
  return {
    DISCORD_TOKEN: TOKEN,
    DISCORD_CLIENT_ID: "123456789012345678",
    DATABASE_PATH: "/data/bot.db",
    CONFIG_PATH: "config/production.json",
  };
}

function captureError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("loadEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the values of a valid environment", () => {
    expect(loadEnv(validEnv())).toEqual({
      DISCORD_TOKEN: TOKEN,
      DISCORD_CLIENT_ID: "123456789012345678",
      DATABASE_PATH: "/data/bot.db",
      CONFIG_PATH: "config/production.json",
    });
  });

  it("reads process.env by default", () => {
    vi.stubEnv("DISCORD_TOKEN", TOKEN);
    vi.stubEnv("DISCORD_CLIENT_ID", "123456789012345678");
    vi.stubEnv("DATABASE_PATH", "/data/bot.db");
    vi.stubEnv("CONFIG_PATH", "config/development.json");

    expect(loadEnv().CONFIG_PATH).toBe("config/development.json");
  });

  it("names every missing variable", () => {
    const error = captureError(() => loadEnv({}));

    expect(error).toBeInstanceOf(ConfigError);
    const message = (error as ConfigError).message;
    expect(message).toContain("Invalid environment");
    expect(message).toContain("DISCORD_TOKEN");
    expect(message).toContain("DISCORD_CLIENT_ID");
    expect(message).toContain("DATABASE_PATH");
    expect(message).toContain("CONFIG_PATH");
  });

  it("rejects an empty token", () => {
    expect(() => loadEnv({ ...validEnv(), DISCORD_TOKEN: "" })).toThrow(
      /DISCORD_TOKEN/,
    );
  });

  it("rejects a client id that is not a snowflake", () => {
    expect(() =>
      loadEnv({ ...validEnv(), DISCORD_CLIENT_ID: "not-an-id" }),
    ).toThrow(/DISCORD_CLIENT_ID: must be a Discord id/);
  });

  it("never echoes the token in the error message", () => {
    const error = captureError(() =>
      loadEnv({ ...validEnv(), DISCORD_CLIENT_ID: "bad", DATABASE_PATH: "" }),
    );

    expect(error).toBeInstanceOf(ConfigError);
    expect((error as ConfigError).message).not.toContain(TOKEN);
  });
});
