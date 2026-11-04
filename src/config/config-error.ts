import type { z } from "zod";

/** A startup problem the operator must fix; its message lists every field at fault. */
export class ConfigError extends Error {
  constructor(title: string, problems: readonly string[]) {
    super([title, ...problems.map((problem) => `  - ${problem}`)].join("\n"));
    this.name = "ConfigError";
  }
}

export function describeIssues(issues: readonly z.core.$ZodIssue[]): string[] {
  return issues.map(
    (issue) =>
      `${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`,
  );
}
