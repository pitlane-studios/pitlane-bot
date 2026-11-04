# Stack and configuration

Confirmed on 2026-11-04.

## Stack

- TypeScript on Node.js 26 (`.nvmrc`) with discord.js v14. The bot uses the gateway, because CAP-1, CAP-6 and CAP-8 need live events and message content.
- SQLite through Node's built-in `node:sqlite` (no native build in the Alpine image), in a single file on a mounted volume.
- Config validated with `zod`.
- Slash commands are registered on the configured guild at startup.
- Shipped as a Docker image, run with Docker Compose and `restart: unless-stopped`.

## Hosting

- A Debian VPS holds a checkout of the repo and runs `docker compose up -d --build`. No image registry for the MVP.
- The SQLite file lives on a named volume. The config file is part of the checkout, so a config change is `git pull` and a rebuild.
- Production and development use two separate Discord applications (two tokens). Development runs against a test guild only.

## Gateway intents

`Guilds`, `GuildMembers` (privileged), `GuildMessages`, `MessageContent` (privileged), `GuildModeration`. Enable the `Message`, `Channel` and `GuildMember` partials so events on uncached objects are still logged.

## Bot permissions (least privilege)

View Channels, Send Messages, Embed Links, Read Message History, Manage Messages, Moderate Members, Kick Members, Ban Members, Manage Roles, View Audit Log, Manage Guild (CAP-7 invite pause through guild incident actions). Never Administrator.

Setup only (CAP-11): Manage Channels, granted to the bot role for the setup run and removed afterwards.

Each application (production, development) has Public Bot off and the two privileged intents on in the Developer Portal.

## Modules (CAP-10)

`modlog`, `moderation`, `roles`, `welcome`, `antiraid`, `antiscam`. Each module registers its own commands and event handlers and has an `enabled` flag. CAP-9 (new-account flag) lives in `modlog`, on the member-joined entry. Future Pitlane features are added as new modules.

## Configuration

| Where | What |
|---|---|
| Environment | `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_PATH`, `CONFIG_PATH` |
| Versioned config file | guild id; staff role; channels; role catalog (group, label, emoji, role); welcome text and links; thresholds (join burst, new-account age, scam timeout); retention periods; scam domain list; `modules.<name>.enabled` |

One config file per environment under `config/` (production, development); `CONFIG_PATH` picks one. The config files are the source of truth for ids, layout and values: this document describes their shape, not their content.

Each role and channel entry holds a `name` and an `id`. Setup (CAP-11) matches by name and fills the id; the bot only reads the id. Channel entries also hold a `category` and a `visibility`:

- `public`: Discord defaults.
- `readOnly`: everyone reads, only staff and the bot send.
- `staff`: only staff and the bot see it.

The bot reads the channels `modLog`, `roles` and `welcome`. The others exist for the server and for Community mode.

The lockdown pause always lasts 24 hours (Discord's maximum); it is not configurable. A scam domain matches the link's host exactly or as a parent domain (`evil.com` matches `cdn.evil.com`), case-insensitive.

### Validation

The bot validates the config at startup. A missing id, an unknown role or channel, or a catalog role at or above the bot role stops startup with a clear error.

## Setup (CAP-11)

`npm run setup` runs outside the bot, over the REST API, with `DISCORD_TOKEN` and `CONFIG_PATH`:

- Creates each missing role (below the bot role) and each missing category and channel, with its visibility. Items that already exist by name are left untouched.
- Writes the ids back into the config file, formatted for Prettier.
- If the bot is not in the guild yet, prints the invite URL (permissions computed from the list above) and stops.
- Prints what it created and the steps left by hand: remove Manage Channels, drag `Moderator` above the bot role, enable Community mode (`#rules`, `#community-updates`), turn on Membership Screening, post the privacy notice in `#rules`.

## Data and privacy (CNIL / GDPR)

Personal data is kept to what moderation needs, for a limited time.

- **Database:** one SQLite table, `sanctions`: id, user id, moderator id, type, reason, duration, created at. No message content, no usernames (resolved from the id when displayed), no DM status (it lives in the mod-log entry). One index, on user id, for `/history`.
- **No panel table:** `/roles-panel` finds its previous panel among the bot's own messages in `#roles`, and buttons use persistent custom ids.
- **Retention:** sanctions older than `retention.sanctionsDays` and `#mod-log` messages older than `retention.modLogDays` are deleted. The owning module (`moderation`, `modlog`) purges at startup and every 24 hours.
- **Erasure:** `/forget` deletes a user's sanctions on request. Their `#mod-log` entries age out with the retention period.
- **Notice:** a privacy notice in `#rules` states what is logged, why (server moderation, legitimate interest), for how long, and that staff handle access and erasure requests (`/history`, `/forget`).
