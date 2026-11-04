import type { Guild } from "discord.js";
import type { Config } from "../config/schema.js";

/** Config checks that need the live guild. Returns one line per problem. */
export async function checkGuild(
  guild: Guild,
  config: Config,
): Promise<string[]> {
  const [roles, channels, me] = await Promise.all([
    guild.roles.fetch(),
    guild.channels.fetch(),
    guild.members.fetchMe(),
  ]);
  const problems: string[] = [];

  if (!roles.has(config.staffRole.id)) {
    problems.push(`staffRole: role ${config.staffRole.id} not found`);
  }

  for (const [key, role] of Object.entries(config.statusRoles)) {
    if (!roles.has(role.id)) {
      problems.push(`statusRoles.${key}: role ${role.id} not found`);
    }
  }

  for (const [key, channel] of Object.entries(config.channels)) {
    if (!channels.has(channel.id)) {
      problems.push(`channels.${key}: channel ${channel.id} not found`);
    }
  }

  config.roleCatalog.forEach((entry, index) => {
    const field = `roleCatalog.${String(index)}.role`;
    const role = roles.get(entry.role.id);
    if (!role) {
      problems.push(`${field}: role ${entry.role.id} not found`);
    } else if (role.comparePositionTo(me.roles.highest) >= 0) {
      problems.push(`${field}: ${role.name} must sit below the bot role`);
    }
  });

  return problems;
}
