import type { DatabaseSync } from "node:sqlite";
import type {
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import type { Config, ModuleName } from "../config/schema.js";

export interface ModuleContext {
  readonly client: Client;
  readonly config: Config;
  readonly db: DatabaseSync;
}

export interface Command {
  /** `new SlashCommandBuilder()…toJSON()` */
  readonly data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute(
    interaction: ChatInputCommandInteraction,
    ctx: ModuleContext,
  ): Promise<void>;
}

export interface EventHandler<
  E extends keyof ClientEvents = keyof ClientEvents,
> {
  readonly event: E;
  handle(ctx: ModuleContext, ...args: ClientEvents[E]): Promise<void> | void;
}

/** A feature behind CAP-10: wired only when `modules.<name>.enabled` is true. */
export interface Module {
  readonly name: ModuleName;
  readonly commands: readonly Command[];
  readonly events: readonly EventHandler[];
}

/** Types the handler's arguments from the event name. */
export function defineEvent<E extends keyof ClientEvents>(
  event: E,
  handle: EventHandler<E>["handle"],
): EventHandler {
  return { event, handle };
}
