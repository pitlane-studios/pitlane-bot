// Entry point: wiring only. Modules are added to `modules` once implemented.
import { Events } from "discord.js";
import { ConfigError } from "./config/config-error.js";
import { loadEnv } from "./config/env.js";
import { loadConfig } from "./config/load-config.js";
import { openDatabase } from "./db/open-database.js";
import { createClient } from "./discord/create-client.js";
import { onReady } from "./discord/on-ready.js";
import type { Module } from "./modules/module.js";
import { wireModules } from "./modules/wire-modules.js";

const modules: Module[] = [];

function fail(error: unknown): never {
  if (error instanceof ConfigError) {
    console.error(error.message);
  } else if (
    error instanceof Error &&
    error.message === "Used disallowed intents"
  ) {
    console.error(
      "Discord refused the privileged intents: in the Developer Portal, " +
        "Bot › Privileged Gateway Intents, enable Server Members Intent and " +
        "Message Content Intent for this application.",
    );
  } else {
    console.error(error);
  }
  process.exit(1);
}

try {
  const env = loadEnv();
  const config = loadConfig(env.CONFIG_PATH);
  const db = openDatabase(env.DATABASE_PATH);
  const client = createClient();
  const ctx = { client, config, db };
  const commands = wireModules(modules, ctx);

  client.once(Events.ClientReady, () => {
    onReady(ctx, commands).catch(fail);
  });
  await client.login(env.DISCORD_TOKEN);
} catch (error) {
  fail(error);
}
