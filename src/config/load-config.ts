import { readFileSync } from "node:fs";
import { ConfigError, describeIssues } from "./config-error.js";
import { configSchema, type Config } from "./schema.js";

export function loadConfig(path: string): Config {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new ConfigError(`Cannot read config ${path}`, [String(error)]);
  }

  const result = configSchema.safeParse(raw);
  if (!result.success) {
    throw new ConfigError(
      `Invalid config ${path}`,
      describeIssues(result.error.issues),
    );
  }

  const missing = missingIds(result.data);
  if (missing.length > 0) {
    throw new ConfigError(
      `Invalid config ${path}`,
      missing.map((field) => `${field}: missing id`),
    );
  }

  return result.data;
}

function missingIds(config: Config): string[] {
  const ids: [string, string][] = [
    ["guildId", config.guildId],
    ["staffRole.id", config.staffRole.id],
    ...Object.entries(config.statusRoles).map(
      ([key, role]): [string, string] => [`statusRoles.${key}.id`, role.id],
    ),
    ...Object.entries(config.channels).map(
      ([key, channel]): [string, string] => [`channels.${key}.id`, channel.id],
    ),
    ...config.roleCatalog.map((entry, index): [string, string] => [
      `roleCatalog.${String(index)}.role.id`,
      entry.role.id,
    ]),
  ];
  return ids.filter(([, value]) => value === "").map(([field]) => field);
}
