# Maintenance and review guide

The [commit audit](commit-history-audit.md) records the project's source history. [Architecture](../architecture.md) describes the current boundaries. This guide records what was cleaned and the conventions to use when changing it.

## Review criteria and research

A maintainable codebase has clear responsibilities, understandable names, one implementation of genuinely shared behavior, explicit data contracts, relevant tests and documentation that matches the executable system. New abstractions should solve a current problem; overly generic helpers can make code harder to review. These criteria follow [Google's code review guidance](https://google.github.io/eng-practices/review/reviewer/looking-for.html).

AI-related concerns were treated as questions to investigate, not proof of authorship. [GitClear's longitudinal analysis](https://www.gitclear.com/ai_assistant_code_quality_2025_research) reports increasing duplication and churn alongside reduced code movement; those aggregate trends do not establish causation for this repository. [DORA's research](https://dora.dev/insights/balancing-ai-tensions/) describes review overhead, integration gaps and the value of small, testable changes. The concrete repository evidence is copied graph/mapping code, abandoned helpers, stale commands, misleading documentation and large commits that mix unrelated behavior.

## Cleanup decisions

| Area | Change | Preserved behavior |
| --- | --- | --- |
| Journey visualization | Shared graph element/document builders, memoized per journey and relevant viewport width | Node IDs/order, styles/layout, public filtering, sizing differences, web/native message bridges and personal export |
| Shared UI | Expandable cards moved from Expo routes to `components/journey`; repeated tab icons use a common definition | Actual screens, tab ordering, card content and Android animations |
| API/data | Removed unused frontend wrappers; shared backend journey record mappers and goal retrieval | Endpoints, response envelopes, public votes, dates/nulls, uploads and binary audio transport |
| Journey processing | Reused schema-derived goal input types and one validation path; statistics use a Set | Manual/narrative defaults and errors, matched-owner counts, reputation/provider call ordering |
| Obsolete code | Removed unused UI controls, color maps, animation helpers, old auth/types, duplicate Redis client, assets, misspelled config files and dangling npm commands | Operational scripts, M4A diagnostic fixture, seed data, provider adapters and live components |
| Landing site | Shared scroll handler and removed unused prop, styles and scaffold assets | Rendered HTML, live style declarations/cascade, navigation destinations and animations |
| Tooling | Removed unused direct dependencies; enabled TypeScript unused checks; added tests and landing checks to CI | Retained dependency versions and native/Expo configuration |
| Database tools | Corrected paths to the existing `backend/db` tree in seed/migration scripts | Dataset contents and database operation order; no database operations were executed during cleanup |

The two journey viewers intentionally differ, and the native SVG community graph has a different data model. They should not be forced into a single configurable screen. Similarly, both landing experiences and the specialized JSON/audio/multipart transports serve active purposes.

Native/Expo modules without direct app imports were retained because autolinking, config plugins, peer dependencies and development builds can consume them. Package removal requires more than a text search.

## Conventions

- Keep the three package boundaries and their lockfiles. Use `npm ci` for reproducible installs; commit manifest and lockfile changes together.
- Keep Expo screens/layouts in `frontend/app`, reusable components in `components`, endpoint calls/types in `api`, pure shared transformations in `utils`, and theme values in `constants`.
- Use PascalCase for React components, camelCase for functions and small helper modules, and feature suffixes such as `.api.ts`, `.controller.ts`, `.processor.ts` and `.service.ts` at existing boundaries. Router filenames follow Expo's conventions.
- Backend routes own middleware, controllers own HTTP translation, processors own use-case sequencing, and services own reusable data operations. Keep prompts/provider adapters separate from persistence.
- Reuse existing validated types and schemas; preserve intentional differences between API submissions, database records and serialized responses. Do not combine types merely because some field names overlap.
- Confirm runtime reachability before deletion: imports, npm scripts, routing conventions, plugins, public endpoints and assets all count. Keep named fixtures when an operational script uses them.
- Extract shared code only when callers need the same behavior. Keep one-off logic beside its feature; avoid wrappers that only rename another function.
- Preserve platform branches and existing response/default/error semantics during cleanup. Record unrelated functional defects separately.
- Match surrounding formatting when editing. Avoid repository-wide formatting and design rewrites in a functional or maintenance change.

## Local validation

```sh
npm --prefix backend run build
npm --prefix backend test
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix LandingPage run lint -- --deny-warnings
npm --prefix LandingPage run build
```

The backend suite uses the existing `tsx` runner and in-memory records. The frontend suite uses TypeScript and Node's test runner to execute generated graph scripts with controlled browser/native bridges. Neither suite requires credentials or external services. CI runs backend build/tests, frontend typechecking/tests, and landing lint/build; native/web export and live integrations need their own smoke validation.

Before/after review also compared graph elements and full Cytoscape configuration against the baseline, and checked 26 goal-input scenarios for identical results, errors and side-effect ordering. The landing page's server-rendered HTML matched the baseline exactly; surviving CSS declarations retained their original order. Lockfile comparison verified that all retained packages kept their versions. Unrelated optional WebSocket validation peers were retained; only unused dependencies and their exclusive dependency trees were removed.

Validation results for this cleanup: backend compilation and all 7 backend tests passed; frontend strict typechecking, all 8 graph tests and Expo web/Android/iOS bundle exports passed; landing lint and production build passed. Browser checks confirmed hero/footer scroll navigation and reported no console errors. Manifest/lockfile and dry-run clean-install checks passed for backend and frontend. No live service writes or native-device tests were performed.

## Known behavior outside this cleanup

The audit separately records the Redis deletion-key mismatch, Clerk community-auth access, single-file proof limitation, placeholder profile text, subset graph references and legacy seed dates. All 30 retained seed files use named months rejected by the current numeric-date schema. Data conversion and these behavior changes need focused tests and review; they were not silently bundled into the structural cleanup.

Live Clerk login, AI requests, Neo4j/Redis operations, proof uploads, and physical-device audio/sharing were not exercised by the isolated tests. Use a controlled test environment to smoke-test those paths before release.

## Sharing and community presentation follow-up

The public-profile share action now targets the Expo web app through `utils/publicJourneyUrl.ts`, with `EXPO_PUBLIC_WEB_APP_URL` available for other deployments. The old landing-site profile links are covered by `LandingPage/vercel.json`; that redirect only becomes live after redeploying the landing project. Browsers without native sharing receive a copyable link prompt.

Trending Paths now separates disconnected groups, retaining the API's ranking order. Each group has readable experience cards, directed connections, previous/next controls, horizontal scrolling and zoom. The layout keeps branching and cyclic connections rather than inventing a linear timeline. The public graph returned 31 nodes and 20 edges during validation; all were retained across 11 paths. Five additional frontend tests cover grouping, branches/merges, cycles, encoded share URLs and the legacy redirect (13 frontend tests in total).

Promotional event branding and the event checklist were removed from the landing page and project READMEs. Historical commit descriptions and user journey content are not promotional copy.

Follow-up validation: all 13 frontend tests, strict typechecking, web/Android/iOS bundle exports, landing lint and landing production build passed. The corrected production profile URL loaded successfully; physical-device sharing still requires a device check.
