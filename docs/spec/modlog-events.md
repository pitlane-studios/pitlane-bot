# Mod-log events (CAP-1)

One embed per event in the staff-only `#mod-log` channel, styled per `look.md`. Every entry carries the user's mention, tag and id, so it stays searchable after a rename.

| Event | Fields | Source CAP |
|---|---|---|
| Member joined | account creation date and age, member count; flag + staff ping if younger than the configured age | CAP-1, CAP-9 |
| Member passed screening | time since join | CAP-6 |
| Member left | time since join, roles held | CAP-1 |
| Message edited | channel, before / after content, jump link | CAP-1 |
| Message deleted | channel, content and attachment names if known, otherwise "not cached"; deleter if the audit log shows one | CAP-1 |
| Bulk delete | channel, count, who ran it | CAP-1, CAP-4 |
| Roles changed | roles added / removed, by whom if the audit log shows it | CAP-1 |
| Nickname changed | before / after | CAP-1 |
| Sanction (bot) | type, reason, moderator, duration, DM delivered / failed, sanction id | CAP-2 |
| Sanction (native UI) | ban / unban / kick / timeout read from the audit log, with moderator and reason | CAP-1 |
| Scam link removed | domain matched, content, author, timeout applied | CAP-8 |
| Lockdown on / off | trigger (auto with join count and window, or manual with moderator), reason, pause end time | CAP-7 |

## Rules

- The bot ignores its own messages and messages from other bots for edit/delete logs.
- Deleting messages in `#mod-log` itself is never logged, to avoid loops.
- Content longer than an embed field is truncated with an ellipsis. No file is attached.
- For messages that are no longer cached (for example after a restart), the entry says "content unknown" instead of being skipped.
- Entries older than `retention.modLogDays` are deleted (`stack.md` › Data and privacy).
