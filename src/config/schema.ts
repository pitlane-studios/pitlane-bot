import { z } from "zod";

// Empty until setup (CAP-11) fills it; loadConfig refuses an empty id.
const id = z
  .string()
  .regex(/^(\d{17,20})?$/, "must be a Discord id (or empty until setup)");

const named = z.strictObject({ name: z.string().min(1), id });

const channel = named.extend({
  category: z.string().min(1),
  visibility: z.enum(["public", "readOnly", "staff"]),
});

const toggle = z.strictObject({ enabled: z.boolean() });

const positiveInt = z.int().positive();

export const configSchema = z.strictObject({
  guildId: id,
  staffRole: named,
  // Status roles: assigned by staff by hand, no permissions, displayed apart.
  statusRoles: z.strictObject({
    maintainer: named,
    contributor: named,
    sponsor: named,
  }),
  channels: z.strictObject({
    rules: channel,
    announcements: channel,
    welcome: channel,
    roles: channel,
    general: channel,
    help: channel,
    modLog: channel,
    staff: channel,
    communityUpdates: channel,
  }),
  roleCatalog: z.array(
    z.strictObject({
      group: z.string().min(1),
      label: z.string().min(1),
      emoji: z.string().min(1).optional(),
      role: named,
    }),
  ),
  welcome: z.strictObject({
    text: z.string().min(1),
    links: z.array(z.strictObject({ label: z.string().min(1), url: z.url() })),
  }),
  thresholds: z.strictObject({
    joinBurst: z.strictObject({
      count: positiveInt,
      windowSeconds: positiveInt,
    }),
    newAccountDays: positiveInt,
    // Discord caps a timeout at 28 days.
    scamTimeoutMinutes: positiveInt.max(28 * 24 * 60),
  }),
  retention: z.strictObject({
    sanctionsDays: positiveInt,
    modLogDays: positiveInt,
  }),
  scamDomains: z.array(
    z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i, "must be a domain name"),
  ),
  modules: z.strictObject({
    modlog: toggle,
    moderation: toggle,
    roles: toggle,
    welcome: toggle,
    antiraid: toggle,
    antiscam: toggle,
  }),
});

export type Config = z.infer<typeof configSchema>;
export type ModuleName = keyof Config["modules"];
