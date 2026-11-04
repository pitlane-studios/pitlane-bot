---
id: SPEC-pitlane-discord-bot
companions:
  - commands.md
  - modlog-events.md
  - stack.md
  - look.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Pitlane Discord bot — MVP (server management)

## Why

Vision plus pain. The Pitlane community Discord (`https://discord.gg/vNaVuc96YH`) is where the app sends users who are stuck, so it must stay clean and easy to moderate as it grows. Staff need one place to sanction, trace and protect the server, and members need to pick their own roles. Discord's native tools (AutoMod, Onboarding, Membership Screening) cover part of this. The bot fills the gaps and gives the project its own extensible base. Pitlane-specific features (network guides, port check, issue previews, secret masking) will plug in later as modules on this base.

## Capabilities

- **CAP-1**
  - **intent:** Staff see every moderation-relevant event in one staff-only `#mod-log` channel: joins and leaves, message edits and deletes, role and nickname changes, and sanctions.
  - **success:** Each event listed in `modlog-events.md` produces one `#mod-log` entry with the fields that file names, including for messages sent before the last bot restart.
- **CAP-2**
  - **intent:** Staff can warn, time out, kick, ban and unban a member with a reason.
  - **success:** Each command in `commands.md` applies the action. It records the moderator, reason, date and duration, and posts a `#mod-log` entry. The member gets a DM before the action; if their DMs are closed, the action still completes and the log says "DM failed".
- **CAP-3**
  - **intent:** Staff can list every sanction the bot recorded for a member, including members who have left, and erase them on the member's request.
  - **success:** `/history` returns every sanction within the retention period, newest first, with type, reason, moderator, date and duration, and the results survive a restart. `/forget` deletes them all.
- **CAP-4**
  - **intent:** Staff can bulk-delete the most recent messages in a channel, optionally only those from one member.
  - **success:** `/purge` deletes up to the requested count within Discord's limits, reports how many were deleted and skipped, and logs it.
- **CAP-5**
  - **intent:** Members add and remove their own roles from a configured catalog (notification pings for now) without asking staff.
  - **success:** A persistent panel in `#roles` toggles each catalog role on click, confirms privately, keeps working after a restart, and cannot grant any role outside the catalog.
- **CAP-6**
  - **intent:** A new member is welcomed with useful links once they pass Membership Screening.
  - **success:** The welcome message is posted once per member, when they pass screening. Nothing is posted on the raw join or for members who leave before passing.
- **CAP-7**
  - **intent:** A sudden burst of joins locks the server against new joins and alerts staff. Staff can also lock or unlock manually. The lockdown pauses invites through Discord's guild incident actions; members already on the server are not affected.
  - **success:** A scripted burst above the configured threshold triggers the lockdown and a staff alert within 10 seconds. The pause lasts 24 hours (Discord's maximum) unless `/lockdown off` lifts it first. Both are logged.
- **CAP-8**
  - **intent:** Messages containing a known scam link are removed and their author is put on hold.
  - **success:** A message containing a domain from the configured scam list is deleted within 2 seconds. Its author is timed out for the configured duration, and the entry logs the content and domain.
- **CAP-9**
  - **intent:** Staff are warned when an account younger than the configured age joins.
  - **success:** Such a join produces a flagged `#mod-log` entry that pings the staff role. The bot takes no automatic action.
- **CAP-10**
  - **intent:** The operator turns each feature (module) on or off in configuration, without changing code.
  - **success:** After a restart with a module disabled, it produces no events, commands or messages, and the other modules work unchanged.
- **CAP-11**
  - **intent:** The operator creates the roles and channels the bot needs on an empty guild in one run, instead of by hand.
  - **success:** `npm run setup` creates every role and channel of the config layout that is missing (matched by name), with its visibility, and writes their ids into the config file. A second run creates nothing. Startup validation then passes. Community mode, Membership Screening, AutoMod and Onboarding stay manual.

## Constraints

- Complement Discord's native AutoMod, Onboarding, Membership Screening and scheduled events, never reimplement them. Rules acceptance stays with Membership Screening.
- Moderation commands are restricted through Discord's command permissions (`default_member_permissions`), not only by checks in the code.
- The bot role has least privilege and never Administrator.
- Single guild: the Pitlane Discord only, with no multi-guild configuration.
- Persistence is one SQLite file holding sanction records only: never message content, never usernames. Message content lives only in `#mod-log`.
- Personal data follows the CNIL / GDPR: sanction records and `#mod-log` entries are deleted after configured retention periods, members can ask for access and erasure, and a privacy notice in `#rules` says so (`stack.md` › Data and privacy).
- The bot token comes from the environment only. Channel ids, role ids, the role catalog, thresholds and the scam list live in a versioned config file.
- Repo, code, docs and bot messages are in English.
- The bot ignores events and interactions from any guild other than the configured one.
- Runs unattended as a Docker container on a Debian VPS and restarts on crash. A restart loses no sanctions and no working panel.
- Requires the privileged Server Members and Message Content intents (CAP-1, CAP-6, CAP-8, CAP-9).
- Every new feature, including future Pitlane features, is a module behind CAP-10. No feature lives outside a module. The setup script (CAP-11) is operator tooling, not a bot feature, and runs outside the bot process.
- Messages and panels follow `look.md`, derived from the Pitlane design system.

## Non-goals

- No Pitlane features: network guides, port check, GitHub issue previews, secret masking, release feed.
- No modmail, events, activity stats or ticket system. These are V2 candidates.
- No levels, XP, economy, music or fun commands.
- No reimplementing native Discord features: keyword filters, onboarding questions, rules acceptance.
- No multi-guild support and no web dashboard. Configuration is by file only.

## Success signal

- On the Pitlane Discord, staff handle all moderation from Discord. Every sanction and member event shows up in `#mod-log`, and the bot's sanctions show up in `/history`.
- A scripted burst of test joins triggers the lockdown and a staff alert.
- Members pick their roles with no staff involvement.
- AutoMod, Onboarding and Membership Screening remain the only systems handling what they cover.

## Assumptions

- The Pitlane Discord is in Community mode with Membership Screening enabled once setup (CAP-11) has created the rules and community updates channels.
- There is one staff role (Moderator) plus the owner, and every moderation command is open to that role.
- `/history` covers only sanctions issued through the bot. Sanctions applied through Discord's own UI appear in `#mod-log` only.
- The code lives in a separate repo, `pitlane-studios/pitlane-bot`.
- The scam domain list is maintained by hand in the config. No public feed.
- Production and development run as two separate Discord applications, so a local dev run never shares a gateway session with production.

## Open Questions

- The role catalog only has notification pings. Which other groups (profile, platform), if any?
