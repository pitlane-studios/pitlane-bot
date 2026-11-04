# pitlane-bot

Discord bot for the [Pitlane](https://github.com/pitlane-studios/pitlane)
community server: moderation log, sanctions, self-assigned roles, raid and scam
protection.

Early stage: the tooling is in place, no bot module is implemented yet.

## Development

Requires Node.js 26 (see `.nvmrc`).

```sh
npm ci
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # TypeScript
npm run test:coverage # Vitest, 100% coverage required
npm run build         # compile to dist/
```

Docker image:

```sh
docker build -t pitlane-bot .
```

## Community

Join the Pitlane Discord: <https://discord.gg/vNaVuc96YH>

## License

[AGPL-3.0-or-later](LICENSE)
