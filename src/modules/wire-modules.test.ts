import { EventEmitter } from "node:events";
import { Events, Guild, type Client } from "discord.js";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
  type MockInstance,
} from "vitest";
import type { Config, ModuleName } from "../config/schema.js";
import { GUILD_ID, validConfig } from "../test-support/config.js";
import {
  defineEvent,
  type Command,
  type Module,
  type ModuleContext,
} from "./module.js";
import { isFromGuild, wireModules } from "./wire-modules.js";

const OTHER_GUILD_ID = "200000000000000002";

function guildInstance(id: string): Guild {
  return Object.assign(Object.create(Guild.prototype) as object, {
    id,
  }) as Guild;
}

function makeCtx(disabled: ModuleName[] = []): {
  ctx: ModuleContext;
  emitter: EventEmitter;
} {
  const config: Config = validConfig();
  for (const name of disabled) config.modules[name].enabled = false;
  const emitter = new EventEmitter();
  const ctx = {
    client: emitter as unknown as Client,
    config,
    db: {},
  } as unknown as ModuleContext;
  return { ctx, emitter };
}

// `execute` as a property, not a method, so tests can read the mock unbound.
function makeCommand(name: string): {
  data: Command["data"];
  execute: Mock<Command["execute"]>;
} {
  return {
    data: { name, description: name },
    execute: vi.fn<Command["execute"]>().mockResolvedValue(undefined),
  };
}

function interaction(commandName: string, guildId: string | null = GUILD_ID) {
  return { isChatInputCommand: () => true, guildId, commandName };
}

let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe("wireModules", () => {
  it("registers no command and no handler for a disabled module", () => {
    const { ctx, emitter } = makeCtx(["roles"]);
    const handle = vi.fn();
    const module: Module = {
      name: "roles",
      commands: [makeCommand("roles")],
      events: [defineEvent(Events.GuildMemberAdd, handle)],
    };

    const commands = wireModules([module], ctx);

    expect(commands).toEqual([]);
    expect(emitter.eventNames()).toEqual([]);
  });

  it("wires only the enabled modules", () => {
    const { ctx, emitter } = makeCtx(["roles"]);
    const roles: Module = {
      name: "roles",
      commands: [makeCommand("roles")],
      events: [defineEvent(Events.GuildMemberRemove, vi.fn())],
    };
    const welcome: Module = {
      name: "welcome",
      commands: [makeCommand("welcome")],
      events: [defineEvent(Events.GuildMemberAdd, vi.fn())],
    };

    const commands = wireModules([roles, welcome], ctx);

    expect(commands.map((command) => command.data.name)).toEqual(["welcome"]);
    expect(emitter.listenerCount(Events.GuildMemberAdd)).toBe(1);
    expect(emitter.listenerCount(Events.GuildMemberRemove)).toBe(0);
    expect(emitter.listenerCount(Events.InteractionCreate)).toBe(1);
  });

  it("returns the commands and adds the handlers of an enabled module", () => {
    const { ctx, emitter } = makeCtx();
    const ping = makeCommand("ping");
    const module: Module = {
      name: "moderation",
      commands: [ping],
      events: [defineEvent(Events.GuildMemberAdd, vi.fn())],
    };

    const commands = wireModules([module], ctx);

    expect(commands).toEqual([ping]);
    expect(emitter.listenerCount(Events.GuildMemberAdd)).toBe(1);
  });

  it("adds no InteractionCreate listener when no enabled module has a command", () => {
    const { ctx, emitter } = makeCtx();
    const module: Module = {
      name: "welcome",
      commands: [],
      events: [defineEvent(Events.GuildMemberAdd, vi.fn())],
    };

    wireModules([module], ctx);

    expect(emitter.listenerCount(Events.InteractionCreate)).toBe(0);
  });

  describe("event handlers", () => {
    function setup() {
      const { ctx, emitter } = makeCtx();
      const handle = vi.fn();
      wireModules(
        [
          {
            name: "welcome",
            commands: [],
            events: [defineEvent(Events.GuildMemberAdd, handle)],
          },
        ],
        ctx,
      );
      return { ctx, emitter, handle };
    }

    it("calls the handler with the context and the event arguments", async () => {
      const { ctx, emitter, handle } = setup();
      const member = { guild: guildInstance(GUILD_ID) };

      emitter.emit(Events.GuildMemberAdd, member);

      await vi.waitFor(() => {
        expect(handle).toHaveBeenCalledWith(ctx, member);
      });
    });

    it("calls the handler when an argument is a Guild of the configured guild", async () => {
      const { ctx, emitter, handle } = setup();
      const guild = guildInstance(GUILD_ID);

      emitter.emit(Events.GuildMemberAdd, guild);

      await vi.waitFor(() => {
        expect(handle).toHaveBeenCalledWith(ctx, guild);
      });
    });

    it("calls the handler when no argument carries a guild", async () => {
      const { ctx, emitter, handle } = setup();

      emitter.emit(Events.GuildMemberAdd, { foo: 1 }, 42);

      await vi.waitFor(() => {
        expect(handle).toHaveBeenCalledWith(ctx, { foo: 1 }, 42);
      });
    });

    it.each([
      ["a guildId of another guild", { guildId: OTHER_GUILD_ID }],
      ["a DM", { guildId: null }],
      [
        "a guild object of another guild",
        { guild: guildInstance(OTHER_GUILD_ID) },
      ],
      ["a Guild instance of another guild", guildInstance(OTHER_GUILD_ID)],
    ])("ignores an event from %s", async (_name, arg) => {
      const { emitter, handle } = setup();

      emitter.emit(Events.GuildMemberAdd, arg);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handle).not.toHaveBeenCalled();
    });

    it.each([
      [
        "throws",
        () => {
          throw new Error("boom");
        },
      ],
      ["rejects", () => Promise.reject(new Error("boom"))],
    ])("logs an error when the handler %s", async (_name, impl) => {
      const { emitter, handle } = setup();
      handle.mockImplementation(impl);

      emitter.emit(Events.GuildMemberAdd, { guildId: GUILD_ID });

      await vi.waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          `[welcome ${Events.GuildMemberAdd}]`,
          expect.objectContaining({ message: "boom" }),
        );
      });
    });
  });

  describe("interactions", () => {
    function setup() {
      const { ctx, emitter } = makeCtx();
      const ping = makeCommand("ping");
      wireModules([{ name: "moderation", commands: [ping], events: [] }], ctx);
      return { ctx, emitter, ping };
    }

    it("executes the matching command with the interaction and context", async () => {
      const { ctx, emitter, ping } = setup();
      const received = interaction("ping");

      emitter.emit(Events.InteractionCreate, received);

      await vi.waitFor(() => {
        expect(ping.execute).toHaveBeenCalledWith(received, ctx);
      });
    });

    it("ignores an interaction that is not a chat input command", async () => {
      const { emitter, ping } = setup();

      emitter.emit(Events.InteractionCreate, {
        ...interaction("ping"),
        isChatInputCommand: () => false,
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ping.execute).not.toHaveBeenCalled();
    });

    it.each([
      ["another guild", OTHER_GUILD_ID],
      ["a DM", null],
    ])("ignores an interaction from %s", async (_name, guildId) => {
      const { emitter, ping } = setup();

      emitter.emit(Events.InteractionCreate, interaction("ping", guildId));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ping.execute).not.toHaveBeenCalled();
    });

    it("ignores an unknown command name", async () => {
      const { emitter, ping } = setup();

      emitter.emit(Events.InteractionCreate, interaction("nope"));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ping.execute).not.toHaveBeenCalled();
    });

    it("logs an error when the command rejects", async () => {
      const { emitter, ping } = setup();
      ping.execute.mockRejectedValue(new Error("boom"));

      emitter.emit(Events.InteractionCreate, interaction("ping"));

      await vi.waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          "[/ping]",
          expect.objectContaining({ message: "boom" }),
        );
      });
    });
  });
});

describe("isFromGuild", () => {
  it.each([
    ["no argument", [], true],
    ["primitives and null", [null, 1, "text", undefined], true],
    ["objects without guild info", [{ foo: 1 }], true],
    [
      "an object whose guild is not a Guild instance",
      [{ guild: { id: OTHER_GUILD_ID } }],
      true,
    ],
    ["a matching guildId", [{ guildId: GUILD_ID }], true],
    ["a mismatching guildId", [{ guildId: OTHER_GUILD_ID }], false],
    ["a null guildId (DM)", [{ guildId: null }], false],
    ["a matching Guild instance", [guildInstance(GUILD_ID)], true],
    ["a mismatching Guild instance", [guildInstance(OTHER_GUILD_ID)], false],
    ["a matching guild property", [{ guild: guildInstance(GUILD_ID) }], true],
    [
      "a mismatching guild property",
      [{ guild: guildInstance(OTHER_GUILD_ID) }],
      false,
    ],
    [
      "the first guild-bearing argument only",
      [1, { guildId: GUILD_ID }, { guildId: OTHER_GUILD_ID }],
      true,
    ],
  ])("handles %s", (_name, args, expected) => {
    expect(isFromGuild(args, GUILD_ID)).toBe(expected);
  });
});
