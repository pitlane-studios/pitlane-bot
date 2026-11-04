import { z } from "zod";
import { ConfigError, describeIssues } from "./config-error.js";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().regex(/^\d{17,20}$/, "must be a Discord id"),
  DATABASE_PATH: z.string().min(1),
  CONFIG_PATH: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

// Issue messages never echo the value, so the token cannot leak into logs.
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new ConfigError(
      "Invalid environment",
      describeIssues(result.error.issues),
    );
  }
  return result.data;
}
