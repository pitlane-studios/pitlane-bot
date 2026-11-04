import type { Config } from "../config/schema.js";

export const GUILD_ID = "100000000000000001";

function channel(
  name: string,
  id: string,
  visibility: "public" | "readOnly" | "staff",
) {
  return { name, id, category: "Category", visibility };
}

/** A fully filled, valid config (all ids set, all modules enabled). */
export function validConfig(): Config {
  return {
    guildId: GUILD_ID,
    staffRole: { name: "Moderator", id: "100000000000000002" },
    statusRoles: {
      maintainer: { name: "Maintainer", id: "100000000000000003" },
      contributor: { name: "Contributor", id: "100000000000000004" },
      sponsor: { name: "Sponsor", id: "100000000000000005" },
    },
    channels: {
      rules: channel("rules", "100000000000000010", "readOnly"),
      announcements: channel("announcements", "100000000000000018", "readOnly"),
      welcome: channel("welcome", "100000000000000011", "readOnly"),
      roles: channel("roles", "100000000000000012", "readOnly"),
      general: channel("general", "100000000000000013", "public"),
      help: channel("help", "100000000000000014", "public"),
      modLog: channel("mod-log", "100000000000000015", "staff"),
      staff: channel("staff", "100000000000000016", "staff"),
      communityUpdates: channel(
        "community-updates",
        "100000000000000017",
        "staff",
      ),
    },
    roleCatalog: [
      {
        group: "Pings",
        label: "Announcements",
        role: { name: "Announcements", id: "100000000000000020" },
      },
      {
        group: "Pings",
        label: "Releases",
        emoji: "📦",
        role: { name: "Releases", id: "100000000000000021" },
      },
    ],
    welcome: {
      text: "Welcome",
      links: [
        { label: "GitHub", url: "https://github.com/pitlane-studios/pitlane" },
      ],
    },
    thresholds: {
      joinBurst: { count: 15, windowSeconds: 30 },
      newAccountDays: 7,
      scamTimeoutMinutes: 1440,
    },
    retention: { sanctionsDays: 365, modLogDays: 90 },
    scamDomains: ["discord-gift.com"],
    modules: {
      modlog: { enabled: true },
      moderation: { enabled: true },
      roles: { enabled: true },
      welcome: { enabled: true },
      antiraid: { enabled: true },
      antiscam: { enabled: true },
    },
  };
}
