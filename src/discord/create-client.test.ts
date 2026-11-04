import { GatewayIntentBits, Partials, type Client } from "discord.js";
import { afterEach, describe, expect, it } from "vitest";
import { createClient } from "./create-client.js";

let client: Client | undefined;

afterEach(async () => {
  await client?.destroy();
  client = undefined;
});

describe("createClient", () => {
  it.each([
    ["Guilds", GatewayIntentBits.Guilds],
    ["GuildMembers", GatewayIntentBits.GuildMembers],
    ["GuildMessages", GatewayIntentBits.GuildMessages],
    ["MessageContent", GatewayIntentBits.MessageContent],
    ["GuildModeration", GatewayIntentBits.GuildModeration],
  ])("requests the %s intent", (_name, intent) => {
    client = createClient();

    expect(client.options.intents.has(intent)).toBe(true);
  });

  it("requests no other intent", () => {
    client = createClient();

    expect(client.options.intents.bitfield).toBe(
      GatewayIntentBits.Guilds |
        GatewayIntentBits.GuildMembers |
        GatewayIntentBits.GuildMessages |
        GatewayIntentBits.MessageContent |
        GatewayIntentBits.GuildModeration,
    );
  });

  it("enables the Message, Channel and GuildMember partials", () => {
    client = createClient();

    expect(client.options.partials).toEqual([
      Partials.Message,
      Partials.Channel,
      Partials.GuildMember,
    ]);
  });
});
