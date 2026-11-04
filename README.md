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

Run locally against the test guild (fill `.env` from `.env.example` first):

```sh
npm run build
node --env-file=.env dist/index.js
```

## Deployment

On the server, with `.env` filled for the production application:

```sh
docker compose up -d --build
```

The config file (`config/production.json`) is baked into the image: a config
change is a `git pull` and the same command. The SQLite database lives on the
`data` volume.

## Community

Join the Pitlane Discord: <https://discord.gg/vNaVuc96YH>

## License

[AGPL-3.0-or-later](LICENSE)
