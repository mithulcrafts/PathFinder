# Backend development

Use the current Node.js 22 LTS release (or a newer supported release) and npm 10+. See [local setup](../docs/setup.md) for credentials and database setup.

From `backend/`:

```sh
npm ci
npm run dev
```

## Local checks

```sh
npm run typecheck
npm test
npm run build
```

`npm test` runs isolated journey mapping and statistics tests. It does not connect to databases, load AI models, or require service credentials. Typechecking rejects unused local declarations and parameters as well as type errors.

## Integration diagnostics and operations

These scripts use the services configured in `.env`; they are not the unit suite.

| Command | Purpose |
| --- | --- |
| `npm run test:upstash` | Redis connectivity |
| `npm run test:neo4j` | Neo4j connectivity |
| `npm run test:geminiGroq` | Gemini and Groq connectivity |
| `npm run test:query` | Query understanding |
| `npm run test:voiceQuery` | Voice query processing |
| `npm run test:audioroute` | Audio request using the retained M4A fixture |
| `npm run migrate` | Apply `db/constraints.cypher` and `db/indexes.cypher` |
| `npm run upload-seeds -- nikhil-kamath.json` | Import a file from `db/journeys/` |
| `npm run generate-embeddings` | Generate and persist experience embeddings |
| `npm run neo4j:keepalive` | Run the scheduled database health query |

Legacy seed files use named-month dates; current validation requires numeric `MM YYYY`. Convert a reviewed copy before importing. See the [history audit](../docs/maintenance/commit-history-audit.md).

Migration, seed, embedding, and backfill scripts are operational entrypoints even when no application file imports them. Review their target database before use.
