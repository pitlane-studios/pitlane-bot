import type { Client, Guild } from "discord.js";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { ConfigError } from "../config/config-error.js";
import type { Command, ModuleContext } from "../modules/module.js";
import { GUILD_ID, validConfig } from "../test-support/config.js";
import { checkGuild } from "./check-guild.js";
import { onReady } from "./on-ready.js";

vi.mock("./check-guild.js");

const set = vi.fn();
const fetchGuild = vi.fn();
const guild = {
  id: GUILD_ID,
  name: "Pitlane",
  commands: { set },
} as unknown as Guild;

const ctx = {
  client: { guilds: { fetch: fetchGuild } } as unknown as Client,
  config: validConfig(),
  db: {},
} as unknown as ModuleContext;

const commands: Command[] = [
  { data: { name: "ping", description: "Ping" }, execute: vi.fn() },
  { data: { name: "warn", description: "Warn" }, execute: vi.fn() },
];

let logSpy: MockInstance<typeof console.log>;

beforeEach(() => {
  vi.resetAllMocks();
  fetchGuild.mockResolvedValue(guild);
  set.mockResolvedValue(undefined);
  logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
});

describe("onReady", () => {
  it("fetches the configured guild", async () => {
    vi.mocked(checkGuild).mockResolvedValue([]);

    await onReady(ctx, commands);

    expect(fetchGuild).toHaveBeenCalledWith(GUILD_ID);
    expect(checkGuild).toHaveBeenCalledWith(guild, ctx.config);
  });

  it("registers the command data on the guild when checks pass", async () => {
    vi.mocked(checkGuild).mockResolvedValue([]);

    await onReady(ctx, commands);

    expect(set).toHaveBeenCalledWith([commands[0]?.data, commands[1]?.data]);
  });

  it("registers an empty list when no command is enabled", async () => {
    vi.mocked(checkGuild).mockResolvedValue([]);

    await onReady(ctx, []);

    expect(set).toHaveBeenCalledWith([]);
  });

  it("logs the guild and the number of registered commands", async () => {
    vi.mocked(checkGuild).mockResolvedValue([]);

    await onReady(ctx, commands);

    expect(logSpy).toHaveBeenCalledWith(
      `Ready on Pitlane (${GUILD_ID}), 2 command(s) registered.`,
    );
  });

  it("throws a ConfigError listing the problems and registers nothing", async () => {
    vi.mocked(checkGuild).mockResolvedValue([
      "staffRole: role 1 not found",
      "channels.rules: channel 2 not found",
    ]);

    const result = onReady(ctx, commands);

    await expect(result).rejects.toBeInstanceOf(ConfigError);
    await expect(result).rejects.toThrow(
      `Config does not match guild ${GUILD_ID}`,
    );
    await expect(result).rejects.toThrow(/staffRole: role 1 not found/);
    await expect(result).rejects.toThrow(
      /channels\.rules: channel 2 not found/,
    );
    expect(set).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });
});
