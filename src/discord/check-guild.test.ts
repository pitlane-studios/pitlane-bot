import { Collection, type Guild } from "discord.js";
import { beforeEach, describe, expect, it } from "vitest";
import type { Config } from "../config/schema.js";
import { validConfig } from "../test-support/config.js";
import { checkGuild } from "./check-guild.js";

interface FakeRole {
  id: string;
  name: string;
  comparePositionTo: (other: unknown) => number;
}

const botRole = { id: "bot" };
let config: Config;

function role(id: string, name: string, position = -1): FakeRole {
  return { id, name, comparePositionTo: () => position };
}

function fakeGuild(roles: FakeRole[], channelIds: string[]): Guild {
  return {
    roles: {
      fetch: () =>
        Promise.resolve(new Collection(roles.map((r) => [r.id, r] as const))),
    },
    channels: {
      fetch: () =>
        Promise.resolve(
          new Collection(channelIds.map((id) => [id, { id }] as const)),
        ),
    },
    members: {
      fetchMe: () => Promise.resolve({ roles: { highest: botRole } }),
    },
  } as unknown as Guild;
}

function allRoles(position = -1): FakeRole[] {
  return [
    role(config.staffRole.id, "Moderator", position),
    ...Object.values(config.statusRoles).map((r) =>
      role(r.id, r.name, position),
    ),
    ...config.roleCatalog.map((entry) =>
      role(entry.role.id, entry.role.name, position),
    ),
  ];
}

function allChannelIds(): string[] {
  return Object.values(config.channels).map((channel) => channel.id);
}

beforeEach(() => {
  config = validConfig();
});

describe("checkGuild", () => {
  it("returns no problem when the guild matches the config", async () => {
    const guild = fakeGuild(allRoles(), allChannelIds());

    expect(await checkGuild(guild, config)).toEqual([]);
  });

  it("reports a missing staff role", async () => {
    const roles = allRoles().filter((r) => r.id !== config.staffRole.id);

    const problems = await checkGuild(
      fakeGuild(roles, allChannelIds()),
      config,
    );

    expect(problems).toEqual([
      `staffRole: role ${config.staffRole.id} not found`,
    ]);
  });

  it("reports a missing channel by its config key", async () => {
    const channelIds = allChannelIds().filter(
      (id) => id !== config.channels.modLog.id,
    );

    const problems = await checkGuild(
      fakeGuild(allRoles(), channelIds),
      config,
    );

    expect(problems).toEqual([
      `channels.modLog: channel ${config.channels.modLog.id} not found`,
    ]);
  });

  it("reports a missing catalog role by its index", async () => {
    const missing = config.roleCatalog[1]?.role.id;
    const roles = allRoles().filter((r) => r.id !== missing);

    const problems = await checkGuild(
      fakeGuild(roles, allChannelIds()),
      config,
    );

    expect(problems).toEqual([
      `roleCatalog.1.role: role ${String(missing)} not found`,
    ]);
  });

  it("reports a missing status role", async () => {
    const roles = allRoles().filter(
      (r) => r.id !== config.statusRoles.sponsor.id,
    );

    const problems = await checkGuild(
      fakeGuild(roles, allChannelIds()),
      config,
    );

    expect(problems).toEqual([
      `statusRoles.sponsor: role ${config.statusRoles.sponsor.id} not found`,
    ]);
  });

  it.each([0, 3])(
    "reports a catalog role whose position compares %i to the bot role",
    async (position) => {
      const roles = [
        ...allRoles().filter((r) => r.id !== "100000000000000020"),
        role("100000000000000020", "Announcements", position),
      ];

      const problems = await checkGuild(
        fakeGuild(roles, allChannelIds()),
        config,
      );

      expect(problems).toEqual([
        "roleCatalog.0.role: Announcements must sit below the bot role",
      ]);
    },
  );

  it("does not compare the staff role with the bot role", async () => {
    const roles = [
      role(config.staffRole.id, "Moderator", 5),
      ...allRoles().slice(1),
    ];

    expect(await checkGuild(fakeGuild(roles, allChannelIds()), config)).toEqual(
      [],
    );
  });
});
