import { Events, Guild, type ClientEvents } from "discord.js";
import type { Command, Module, ModuleContext } from "./module.js";

/**
 * Attaches the handlers of enabled modules to the client and returns their
 * commands, to register on the guild once the client is ready. Disabled
 * modules are skipped entirely.
 */
export function wireModules(
  modules: readonly Module[],
  ctx: ModuleContext,
): Command[] {
  const { client, config } = ctx;
  const commands = new Map<string, Command>();

  for (const module of modules) {
    if (!config.modules[module.name].enabled) continue;

    for (const command of module.commands) {
      commands.set(command.data.name, command);
    }
    for (const handler of module.events) {
      client.on(handler.event, (...args: unknown[]) => {
        if (!isFromGuild(args, config.guildId)) return;
        run(`${module.name} ${handler.event}`, () =>
          handler.handle(ctx, ...(args as ClientEvents[typeof handler.event])),
        );
      });
    }
  }

  if (commands.size > 0) {
    client.on(Events.InteractionCreate, (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      if (interaction.guildId !== config.guildId) return;
      const command = commands.get(interaction.commandName);
      if (!command) return;
      run(`/${interaction.commandName}`, () =>
        command.execute(interaction, ctx),
      );
    });
  }

  return [...commands.values()];
}

/**
 * False when an argument belongs to another guild or to a DM. Events that
 * carry no guild (none of the module events so far) pass.
 */
export function isFromGuild(
  args: readonly unknown[],
  guildId: string,
): boolean {
  for (const arg of args) {
    const id = guildIdOf(arg);
    if (id !== undefined) return id === guildId;
  }
  return true;
}

function guildIdOf(value: unknown): string | null | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (value instanceof Guild) return value.id;
  if ("guildId" in value) return value.guildId as string | null;
  if ("guild" in value && value.guild instanceof Guild) return value.guild.id;
  return undefined;
}

function run(label: string, task: () => Promise<void> | void): void {
  Promise.resolve()
    .then(task)
    .catch((error: unknown) => {
      console.error(`[${label}]`, error);
    });
}
