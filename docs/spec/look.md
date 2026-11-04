# Look (embeds, panels, replies)

Derived from the Pitlane design system ("The Timing Tower"). Discord renders its own fonts and components, so only the rules that survive in an embed carry over: rationed colour, square status marks, uppercase labels, no faces.

## Colours

Embed side colours come from the Pitlane palette. The three flag colours mean a status and nothing else (The Flag Rule).

| Flag | Hex | Square | Meaning | Used for |
|---|---|---|---|---|
| Green Flag | `#24cf82` | 🟩 | member in good standing, server restored | member joined, passed screening, unban, lockdown off |
| Yellow Flag | `#f3d24b` | 🟨 | member under watch | new-account flag, warn, timeout |
| Red Flag | `#ee3537` | 🟥 | member removed, server under threat | kick, ban, scam link removed, lockdown on |
| Pylon Panel | `#242424` | none | routine trace, no status | member left, message edited or deleted, bulk delete, roles or nickname changed, welcome, role panel |

Daytona Blue (`#67bbeb`) is for actions only and is not used as an embed colour. Discord does not let a bot colour its buttons; catalog buttons use the Primary style, the closest to "every interactive element is blue".

## Embeds

- **Title:** the status square (if any), then the event in uppercase: `🟥 BAN`, `🟨 NEW ACCOUNT`, `MESSAGE DELETED`. No other emoji.
- **Field names:** uppercase (`REASON`, `MODERATOR`, `DURATION`, `CHANNEL`). Values in sentence case.
- **Ids and durations:** inline code (`` `123456789012345678` ``, `` `7d` ``), so they read as fixed-width values.
- **Dates:** Discord timestamps (`<t:…:f>` and `<t:…:R>`), so each reader sees their own time zone.
- **No avatars, thumbnails or images.** Mention, tag and id identify the user (no faces are drawn).
- **Footer:** the sanction id when there is one, otherwise the user id.

## Role panel (CAP-5)

- One embed in Pylon Panel: title `ROLES`, one sentence of help.
- One row of buttons per catalog group, at most 5 per row. Label in uppercase, the catalog emoji before it if set.
- A click answers privately in one sentence: `Added Releases.` / `Removed Releases.`

## Welcome (CAP-6)

- One embed in Pylon Panel: title `WELCOME`, the configured text in sentence case, links as a list. Mentions the member in the message content, not in the embed, so the ping fires.

## Replies and DMs

- Staff replies are ephemeral, plain sentences: `Warned @user. Sanction #12.`
- A refusal or failure starts with 🟥 and names the cause: `🟥 Cannot ban @user: their top role is above mine.`
- A sanction DM is an embed in the sanction's flag colour, titled with the action and the server (`🟨 WARNING · PITLANE`), with `REASON` and `DURATION` fields.
