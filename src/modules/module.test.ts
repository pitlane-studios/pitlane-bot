import { Events } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { defineEvent } from "./module.js";

describe("defineEvent", () => {
  it("returns the event name and its handler", () => {
    const handle = vi.fn();

    const handler = defineEvent(Events.GuildMemberAdd, handle);

    expect(handler).toEqual({ event: Events.GuildMemberAdd, handle });
  });
});
