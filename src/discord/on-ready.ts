import { ConfigError } from "../config/config-error.js";
import type { Command, ModuleContext } from "../modules/module.js";
import { checkGuild } from "./check-guild.js";

/** Runs once the client is ready: checks the guild, then registers commands. */
export async function onReady(
  ctx: ModuleContext,
  commands: readonly Command[],
): Promise<void> {
  const guild = await ctx.client.guilds.fetch(ctx.config.guildId);

  const problems = await checkGuild(guild, ctx.config);
  if (problems.length > 0) {
    throw new ConfigError(`Config does not match guild ${guild.id}`, problems);
  }

  await guild.commands.set(commands.map((command) => command.data));
  console.log(
    `Ready on ${guild.name} (${guild.id}), ${String(commands.length)} command(s) registered.`,
  );
}
