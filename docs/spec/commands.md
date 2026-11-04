# Commands

All commands are slash commands registered in the Pitlane guild only. **Staff** means the command is gated by `default_member_permissions`, and the permission that gate requires is listed. The bot also re-checks the permission and its own role hierarchy before acting.

| Command | Options | Who | Effect | Logged (CAP-1) | CAP |
|---|---|---|---|---|---|
| `/warn` | `member`, `reason` (required) | Staff (Moderate Members) | Records a warning and DMs the member | yes | CAP-2 |
| `/timeout` | `member`, `duration` (60s–28d), `reason` | Staff (Moderate Members) | Discord timeout, recorded, member gets a DM | yes | CAP-2 |
| `/kick` | `member`, `reason` | Staff (Kick Members) | DM, then kick, recorded | yes | CAP-2 |
| `/ban` | `user` (member or id), `reason`, `delete_messages` (0–7 days) | Staff (Ban Members) | DM if still a member, then ban, recorded | yes | CAP-2 |
| `/unban` | `user_id`, `reason` | Staff (Ban Members) | Lifts the ban, recorded | yes | CAP-2 |
| `/history` | `user` (member or id) | Staff (Moderate Members) | Lists the bot-recorded sanctions, newest first, paginated, visible only to the caller | no | CAP-3 |
| `/forget` | `user_id`, `reason` | Staff (Ban Members) | Deletes every bot-recorded sanction of the user (erasure request) | yes, without the deleted content | CAP-3 |
| `/purge` | `count` (1–100), `member` (optional) | Staff (Manage Messages) | Bulk-deletes recent messages | yes | CAP-4 |
| `/lockdown` | `on` \| `off`, `reason` | Staff (Moderate Members) | Pauses invites for 24 hours, or lifts the pause | yes | CAP-7 |
| `/roles-panel` | none | Staff (Manage Roles) | Posts or refreshes the `#roles` panel | yes | CAP-5 |

## Rules

- Every staff reply is visible only to the caller. The public trace lives in `#mod-log`.
- The bot refuses to act on itself, on the caller, on the guild owner, and on any member whose top role is equal to or above the bot's or the caller's. The refusal names the reason.
- DM before kick or ban: once the member leaves the server, the bot can no longer DM them. A failed DM never blocks the action, and the log records "DM failed".
- `/purge` limits come from Discord: messages older than 14 days cannot be bulk-deleted and are reported as skipped.
- `/timeout` duration is capped at 28 days by Discord.
- `/lockdown` is gated by Moderate Members so the Moderator role does not need Manage Guild. The bot applies the pause with its own Manage Guild permission.
- Replies, panels and buttons follow `look.md`.
- Role panel (CAP-5): buttons or a select menu bound to the configured catalog. Clicks are handled from persistent component ids, so the panel survives restarts. The bot only assigns catalog roles, and every catalog role sits below the bot role.
