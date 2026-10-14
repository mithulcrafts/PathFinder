# PathFinder frontend

Expo React Native app for Android, iOS and web, using Expo Router and Clerk.

## Setup

Use the current Node.js 22 LTS release (or a newer supported release) and npm 10+.

```sh
cd frontend
npm ci
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to your Clerk publishable key and `EXPO_PUBLIC_API_BASE_URL` to the API root **including `/api`**. Never place backend secret keys in Expo public variables.

Shared profiles use `EXPO_PUBLIC_WEB_APP_URL`, defaulting to `https://path-finder-webapp.vercel.app`. This must point to the Expo web client, not the landing website. Rebuild the frontend after changing Expo public variables. The frontend Vercel rewrite supports direct `/u/:username` links; the landing project's redirect also recovers older links after that project is redeployed.

| Target | Example API root |
| --- | --- |
| Web | `http://localhost:5000/api` |
| Android emulator | `http://10.0.2.2:5000/api` |
| iOS simulator | `http://127.0.0.1:5000/api` |
| Physical device | `http://<YOUR_WIFI_IP>:5000/api` |

Use `npm run web`, `npm run android` or `npm run ios` for the corresponding target. Native builds are needed when testing integrations unavailable in Expo Go.

## Structure

```text
app/                     Expo routes and layouts only
  (tabs)/                ask, community, journey, profile
  u/[username].tsx       Public or query-filtered journey profile
  index.tsx              App landing and authentication
  results.tsx            Query results, translation and speech
  share-journey.tsx       Draft review and submission
  journey-details.tsx    Individual timeline detail
  oauth-native-callback.tsx
api/                     HTTP transport, endpoint wrappers and response types
components/
  community/             Native SVG community graph
  journey/               Reusable expandable goal/experience cards
  landing/               Expo landing sections and animation primitives
  ui/                    Shared controls
constants/               Theme palettes
utils/                   Dates, graph layouts and public journey URLs
types/                   Query/timeline interfaces
tests/                   Isolated graph behavior tests
```

The separately deployed Vite site is in `../LandingPage/`. It is not a replacement for the Expo landing/auth route.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

Typechecking rejects unused declarations. The tests use the existing TypeScript compiler and Node's test runner; they exercise generated graph scripts, community layouts, share URLs and the legacy redirect without loading React Native, Clerk or external services. The build exports the web app. Testing real login, recording, uploads, sharing and native graph interactions still requires the appropriate environment/device.

## Transport and platform conventions

Use `apiFetch` for JSON requests. Audio responses and proof uploads have their own binary/multipart handling; keep platform-specific content types, filenames and error behavior when modifying them. Authentication tokens come from Clerk.

Both journey graph screens use `utils/journeyGraph.ts`, preserving personal/public sizing differences and existing message protocols. Reuse the shared UI in `components/`; helper files under `app/` are interpreted as routes by Expo.

See [architecture](../docs/architecture.md), [local setup](../docs/setup.md), and [maintenance rules](../docs/maintenance/README.md).
