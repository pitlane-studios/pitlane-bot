# AGENTS.md

Guidance for working in this repository. Revise it in the same change that makes it stale.

## What This Is

The Discord bot for the Pitlane community server (Pitlane: <https://github.com/pitlane-studios/pitlane>). The MVP is server management: moderation log, sanctions, history, purge, self-assigned roles, welcome, raid and scam protection. Pitlane-specific features come later, as modules.

## The Spec

`docs/spec/SPEC.md` and its companions (`commands.md`, `modlog-events.md`, `stack.md`, `look.md`) are the contract. Read them before implementing or changing a feature, and cite the capability (`CAP-n`) in the PR. Open questions and assumptions are listed at the end of `SPEC.md`: when work touches one, raise it instead of picking an answer. The `bmad-spec` skill keeps its decision log in `docs/spec/.memlog.md`, git-ignored: it stays local.

## Stack

Node.js (version in `.nvmrc`), TypeScript, discord.js v14, SQLite, Docker. Versions live in `package.json`.

- TypeScript stays on 6.0: `typescript-eslint` 8.x requires `typescript <6.1`.
- Every feature is a module under `src/modules/<name>/` with its own commands, event handlers and `enabled` flag (CAP-10). The contract is `Module` in `src/modules/module.ts`; a new module is added to the `modules` list in `src/index.ts`, which only wires modules.
- Secrets come from the environment (`.env.example`); everything else from the versioned config file, validated at startup.

## Commands

The scripts in `package.json`: `lint`, `format:check`, `typecheck`, `test:coverage` (100% coverage gate, `src/index.ts` excluded), `build`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `<type>(scope): <subject>`. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`. Use the module name as scope (`feat(moderation): …`). Keep the issue reference (`Closes #6`) in the body, not the subject.

## CI Gates

`main` requires **Lint** (ESLint, Prettier, TypeScript), **Tests** (Vitest, 100% coverage) and **Build Docker Image**.

## How to Work Here

- **Decide out loud.** Name your assumptions and the tradeoffs before writing code; when a request reads more than one way, raise it instead of guessing.
- **Keep it small.** Ship the least code that solves the problem: no speculative hooks, no abstraction for something used once.
- **Stay in scope.** Change only what the task needs and match the surrounding style.
- **Work to a checkable goal.** Break multi-step work into steps each with a way to confirm it. Hand back the exact commands for the maintainer to run instead of running the linters or tests yourself.
- **Least privilege.** A feature needing a new intent or permission updates `docs/spec/stack.md` in the same change.
- **Everything in English**: code, docs, commits, bot messages (until the spec decides otherwise).
