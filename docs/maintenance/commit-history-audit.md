# Commit history audit

Audit baseline: `09cd4a7093172fa256b3fcc986014981ac80d488`, before the September 2026 maintenance changes. Paths and findings below describe that baseline, including files subsequently removed or moved by the cleanup.

## Scope and method

The baseline has **240 reachable commits**. Before July 6 there are **79 non-merge commits (including the initial commit) and 42 merges**. The July 6–13, 2026 window contains **117 commits: 79 non-merge commits and 38 merges**. Dates use the commits' `+05:30` timezone. The final July commit is `8fae64f` at 23:48 on July 13; two August 29 maintenance commits follow it. Every commit is represented below; scope is history reachable from the baseline, not remote-only branches.

This review used commit trees, file inventories, parent diffs, focused runtime/API diffs, and combined merge diffs. The ledger describes changes visible in those diffs, rather than treating commit titles as evidence of implementation. For broad visual rewrites, review focused on navigation, state, handlers, contracts, and component ownership; it does not certify every visual difference. Dependency lockfiles and seed additions were inventoried rather than independently validating every resolved package or biographical claim. Every non-merge commit has a diff-based entry; this is not a line-by-line certification of every historical source version.

Git records what changed, but does not establish whether a human reviewed a change or whether AI authored it. The observable problems are overlapping implementations, abandoned code, drifting contracts, inaccurate descriptions, and large mixed-purpose commits. No current `AGENTS.md` was present in the repository or its parent directories at audit start; the historical `.agents/AGENTS.md` was deleted in `8fae64f`.

Useful reproduction commands:

```sh
git log --reverse --since='2026-07-06T00:00:00+05:30' --until='2026-07-14T00:00:00+05:30' --format='%h %ad %p %s' --date=iso-strict
git show --format=fuller --stat <commit>
git show --format= -- <path>
git diff <commit>^ <commit> -- <path>
git show --cc <merge-commit> -- <path>
```

## Architecture established before the rush

- June 9's `93acc0b` establishes the backend package boundary. June 18's `11a5226` adds graph schema/seed documents, graph writing, embeddings, and validation alongside Neo4j service helpers.
- June 23's `20470f9` connects routes → controllers → processors → services/providers. Its query controller calls query understanding, context retrieval, then aggregation; graph/vector retrieval, AI insight generation, and pattern generation are separate modules.
- June's Expo work establishes file-based screens, `api/` HTTP wrappers, auth initialization, shared UI constants, and schema types. UI churn predates July 6; there are already multiple visual redesigns in late June and July 1.
- July 5's `ed43924`, merged July 6 in `6c55789`, is itself a major architectural rewrite: conversation sessions, draft extraction, goal submission, experience submission, and transition inference replace the earlier whole-narrative extraction/normalizer/static-validator pipeline. It removes corresponding scripts but leaves script commands and some old types/helpers behind. Therefore simply reverting to an early July snapshot would restore obsolete behavior and lose working features.
- At the baseline there are three separately built packages: Express/TypeScript `backend`, Expo/React Native `frontend`, and the Vite/React marketing site `LandingPage` added on July 13. The marketing site is an intentional separate entry point, not an unused duplicate of the authenticated Expo application.

## Non-merge commit ledger

“Purpose” below is an inference from the actual change. A maintenance consequence is noted when the diff provides concrete evidence.

### May 26–June 18: package, storage, and provider foundations

| Commit | Observed implementation and purpose |
| --- | --- |
| `0446268` | Creates a one-line project README; no application code. |
| `b88a895` | Adds Node 22 GitHub CI jobs for future frontend/backend package directories, `npm ci`, and build commands. The initial frontend build assumption predates Expo's eventual command structure. |
| `077b990` | Creates the Express/TypeScript ESM backend, environment template, Upstash Redis client, and live set/get/delete connectivity script. Installs several prospective dependencies before they have runtime consumers. |
| `93acc0b` | Moves backend source, package/lockfile, configuration and README into `backend/` without changing their contents; establishes the monorepo package boundary. |
| `0fdfcbc` | Removes the frontend CI job while retaining backend installation/build; no runtime change. |
| `528f61c` | Adds whitespace to CI only. Its title mentions Upstash, but the patch contains no Upstash implementation. |
| `1fd5f9d` | Removes that trailing CI whitespace only; no runtime safety change. |
| `6e7cff8` | Adds Neo4j graph-design documentation and a run guide, deletes the one-line backend README, and creates an empty Neo4j configuration file. This is design scaffolding, not a working graph connection yet. |
| `72c3ab6` | Revises graph relationship documentation, makes direction rules explicit, and removes the anti-pattern list; no executable graph change. |
| `c9e6ca5` | Adds the PR description template; no application behavior. |
| `0419b8a` | Implements validated Neo4j driver configuration, connectivity test, constraints/index files, and a migration CLI that reads and executes Cypher. Its initial embedding index dimension is 768; later embedding implementation changes it. |
| `ba5d521` | Guards a possibly absent migration statement and a missing first test-query record to satisfy strict TypeScript checks. |
| `610fb8e` | Adds Gemini/Groq clients and text-generation provider methods, validates API key presence, installs Zod, and supplies a live provider test command. |
| `11a5226` | Adds four structured seed journeys and raw narratives, the graph writer and journey schema/types, seed uploader, local embedding initialization/generation, and Neo4j session helpers. Adds query-understanding scaffolding; some new schema/prompt files are still empty. Establishes shared storage/embedding modules later reused by onboarding. |
| `4043528` | Completes the query Zod schema and query-understanding prompt, and adds Groq structured JSON generation using JSON schema, empty-response detection and JSON parsing. This fills missing implementation, not merely build formatting. |

### June 23–29: query pipeline, initial frontend, and authentication

| Commit | Observed implementation and purpose |
| --- | --- |
| `20470f9` | Connects `/api/query` to query understanding, semantic/vector retrieval, owner/graph expansion, focus boosting, timeline/statistics aggregation, pattern mining, and AI insights. Adds Gemini structured generation and experience timeline summaries, including seed/schema/embedding updates. This establishes most of the query processing/service separation retained today. |
| `350c5e8` | Adds an Expo starter at repository root, basic placeholder route screens, generated icons/configuration, and a separate starter `App.tsx`/`index.ts` entry. Routes exist before the package uses the Expo Router entry. |
| `59563b9` | Adds Sarvam translation, speech synthesis and transcription provider methods, key/configuration handling and manual integration scripts. Speech synthesis initially returns base64. |
| `b7d1fbd` | Moves the Expo package/screens/assets into `frontend/` unchanged and separates ignore rules. |
| `ce8e048` | Adds ClerkProvider and SecureStore token caching, Google OAuth and signed-in profile redirection; replaces landing/profile placeholders with forms. Profile saving is still a local navigation action. Also commits generated `.expo` logs/device/favicon files. |
| `905f85e` | Changes profile language values to codes and adds a dummy `API_URL/user/profile` fetch that navigates even on failure. Adds result schema interfaces and a detailed mock results payload/UI. |
| `1b12cbf` | Extends the query controller to base64 audio transcription, optional translation and optional synthesized response; changes Sarvam transcription default to translation. Commits generated `output.wav`. |
| `7e958f2` | Adds mock dashboard, event details, public profile and chat onboarding; expands results into mock carousel/tabs and creates a 480px web shell. Query/microphone/share-journey flows are still demonstrations, not complete API integrations. |
| `9d163e6` | Adds a full-journey flowchart screen with node detail selection and zoom, milestone selection helper, node/emotion display types/colors, result cards/carousel, and animated mock microphone transcription. More presentation-specific fields enter frontend schemas. |
| `874878d` | Replaces base64 query audio with Multer multipart audio and input-resolution/speech services; separates translation/speech into output controllers/processors/routes. TTS now returns WAV bytes. Adds request-body/file logs and an audio fixture alongside the integration work. |
| `932a45d` | Wires query recording/text submission to live fetches, passes results through route parameters, and adds translation/audio playback requests. Failure paths still inject mock transcription/results; output language remains hardcoded. |
| `f10c503` | Removes root orphan entry and tracked editor/Expo artifacts/instructions, adds ignores and frontend setup/environment documentation. No product feature removal. |
| `f8c230f` | Uses `expo-router/entry`, installs/configures Expo Router and the URL scheme, and deletes the unused starter `App.tsx`; makes file-based routing the actual app entry. |
| `6aba01c` | Normalizes live query envelopes and adjusts frontend types for nullable dates/organizations, achievements arrays and optional display-only fields. Retains mock fallback. |
| `4b7e290` | Adds OAuth callback, corrects signed-in redirects, adds sign-out/native profile sharing, null-safe event fields and array achievements, and replaces results presentation. The result rewrite also removes the recently added translation/playback handlers and introduces deterministic display percentages; it is broader than its bug-fix title. |
| `10971ca` | Documents recent frontend fixes in README; no source changes. |
| `731695c` | Adds OAuth callback to the README tree and removes that recent-fixes section; no source changes. |
| `24a41e7` | Restores frontend CI using `npm ci` plus TypeScript checking rather than assuming a build script. |
| `814230e` | Introduces a shared light `BRAND_COLORS` palette and replaces colors/styles across screens; adds README instructions that incorrectly describe a Flask backend, corrected later. No new API pipeline. |
| `c50af56` | Adds and renders the landing logo image. |
| `18304c8` | Adds Clerk middleware, authenticated query access, auth synchronization into Neo4j and profile update service/controller/routes; configures local CORS and graph user email fields. Also creates frontend `apiFetch`, auth API/service wrappers and username-aware post-login redirects. The profile route module is created but is not yet mounted in the server. |

### June 30: tab navigation, community, and competing onboarding approaches

| Commit | Observed implementation and purpose |
| --- | --- |
| `ee36f24` | Adds NativeWind/Babel/Metro/Tailwind configuration and Home/History/Community/Profile tabs; moves query into the tab group, combines profile/dashboard controls, deletes old dashboard/profile routes, and updates landing redirect. Several tab contents still use mocks/placeholders. |
| `b4c2ecf` | Sets Tailwind `darkMode: 'class'`, removes one emoji, and makes formatting/import-order changes. |
| `03f80f8` | Declares CSS modules for TypeScript so the global CSS import typechecks. |
| `c21fdd7` | Extracts authenticated query requests into an API wrapper and connects profile save to the auth API wrapper; adds historical workspace instructions. The new query wrapper temporarily targets `/query/query`. |
| `b769258` | Adds output API wrappers and restores results translation, speech playback, preference loading, query-type-dependent sections and follow-up submission. Temporarily switches voice upload back to base64 JSON, inconsistent with the multipart backend. |
| `50f4c3f` | Restores multipart voice upload, corrects query endpoint to `/query`, and mounts backend user routes. Leaves the old FileSystem import behind. |
| `31e606b` | Adds authenticated whole-narrative extraction, Gemini output schema/prompt, generated usernames/IDs, date/default normalization and graph response shaping. Creates `/journey/extract`, reorganizes query/output route prefixes, and adds a live extraction script; it does not yet persist the extracted graph. |
| `2f7ec77` | Adds public community topic/subtopic/search/journey endpoints, processor validation and Neo4j reads/ranking/pagination. Initial public graph mapping is a single broad query with nested experience relations. |
| `1a2c086` | Adds one blank line to the community controller only; no route or logic changes despite the title. |
| `b7d7d2f` | Renames the mis-cased subtopics processor to a temporary filename without content changes. |
| `9c429ed` | Renames the temporary file to match `getSubtopics.processor.ts` imports; completes the case correction. |
| `6b32185` | Validates extraction through Zod and ID-prefix rules, returns structured validation success/failure, and adds validation test fixtures/script. Copies username-prefix logic already present in extraction. |
| `9bf8dd8` | Corrects the root README's Flask/Python setup claims to the actual Express/TypeScript/Neo4j setup. |
| `a90cdee` | Adds community frontend API wrappers, live topic/subtopic filters and refresh/list states; replaces the public-profile mock timeline with fetched/sorted community journey data. |
| `ffbd41d` | Guards back navigation across six screens and falls back to `/` when no back stack exists; repeats this small navigation pattern at each call site. |
| `42232ab` | Cycles through canned follow-up questions in the mock onboarding chat instead of repeating one response; still no model call. |
| `a2d7085` | Adds missing-username fallbacks for community avatar/text/navigation. |
| `3392af2` | Handles serialized Neo4j integer objects in community reputation/experience-count rendering by reading `.low`. |
| `a9def72` | Uses index-based fallback keys for null community usernames. |
| `8e7ce4b` | Converts remaining screen styles to NativeWind and updates the constrained web shell, buttons and wrapped text. Most request/state logic stays intact; a share-journey finish control still refers to the already removed dashboard route. |

### July 1–5: repeated visual revisions and onboarding replacement

| Commit | Observed implementation and purpose |
| --- | --- |
| `73751f3` | Adds a whole-graph normalization pipeline (trim, skill/proof/relation deduplication, chronological sort), static-analysis registry/validators, and manual test scripts; controller returns normalized data plus findings. These are later replaced by draft/session onboarding. |
| `de2e57b` | Rebuilds landing/profile sections, retains profile save/auth actions, and removes an unused profile share handler. Adds repeated marketing call-to-action sections. |
| `a6508eb` | Replaces landing/profile presentation with dark cards and feature/stat sections; extends shared brand/Tailwind colors. Authentication redirect structure is retained. |
| `d9ed731` | Replaces those pages' brand references with duplicated local monochrome `C` palettes; adds dot/ring/crosshair decorations and rewrites feature/card markup. This creates a concrete second styling source alongside shared tokens. |
| `f3358d5` | Replaces landing dots/rings with grid lines, alternating section backgrounds, decorative circles and statistics markup. |
| `9123138` | Copies a grid background implementation and adjusted surface/card colors into profile to match landing. |
| `14bd74e` | Raises grid/ring visibility in the two pages; visual constants only. |
| `cfa60b8` | Replaces both grid helpers with duplicated soft-glow helpers and removes hard-edged background decorations. |
| `72835f2` | Adds reusable animated `Starfield` with randomized particles and mounts it on landing/profile; adds looping animation work. |
| `1cb7f02` | Deletes Starfield and replaces it with `AmbientBackground`, using a few large slowly moving glows on both pages. |
| `4c44946` | Deletes AmbientBackground and returns to page-local static glow/dot/diagonal-line helpers. The two earlier background files are correctly removed in this sequence, so their mere historical existence is not current dead code. |
| `748858e` | Removes the root web max-width/border/shadow wrapper, allowing full-width pages. |
| `6c1b222` | Adds landing hero crosshairs/rings and stronger glows, **and restores the 480px root web constraint** removed immediately before it. |
| `6992b4c` | Introduces project `requireAuth` middleware using Clerk `getAuth`, sets typed `req.userId`, and changes query/journey guards and auth/user controller access. Removes the old auth helper; auth/user route wiring is completed later. |
| `2396486` | Adds conversation validation schema/prompt/processor, an existing-user graph retrieval service and manual pipeline scripts; extraction accepts conversation messages. The route controller still calls extraction/normalization/static analysis, not the new conversation validator. Also adds Expo auth/linking/browser/worklets dependencies. |
| `c672f71` | Replaces dark landing with eleven extracted `LandingSections`, adds `L` tokens and Manrope font/splash loading, and restyles profile. New font/splash package majors initially conflict with Expo 56. |
| `b70b2c3` | Aligns font/splash/reanimated/safe-area package versions with Expo 56 and updates Expo/lockfile. |
| `9007deb` | Adds Reanimated scroll/reveal/stagger/button/microphone helpers and context, rewrites landing sections, replaces branding assets, and removes the placeholder email action. This is substantial UI/animation infrastructure, unrelated to backend graph transitions. |
| `ed43924` | Replaces whole-graph extraction/validation with Redis conversation sessions, goal extraction/deduplication, draft continuation/finalization, submission and transition inference; changes graph/embedding/schema/types and seed representation. Removes old processors/scripts but leaves stale package commands and an `auth 2.ts` copy. This is the principal architectural pivot preceding July 6. |
| `813c411` | Replaces frontend owner/profile/history mocks with API loading and errors, introduces journey API types and a 10-second shared request timeout, connects chat finish to extraction, and adds Clerk's web captcha host. Also adds an owner graph endpoint on the competing frontend branch using the soon-to-be-removed retrieval service, and duplicates experience-to-display mapping between screens. |
| `c0d3718` | Removes fake recording/results/event fallback data and replaces missing-data paths with explicit errors/empty states; ensures connection failures stop displaying demo results. |
| `651bc11` | Adds another persistence implementation: extraction now writes a transaction that deletes/recreates the user's goals/experiences and recreates skills/contributions/transitions. It assumes object-style `req.auth`; July 6 removes this competing implementation when restoring the session-based architecture. |
| `6fa63d8` | Rolls selected backend files back to an earlier server/provider/package state, removes the newly added owner endpoint and unmounts user/journey/community routes. Does not simply undo only the immediately preceding persistence file; subsequent restoration/merge commits are necessary to reconstruct the runtime. |

### July 6–8

| Commit | Observed implementation and purpose |
| --- | --- |
| `ae7bce3` | Changes historical agent instructions to distinguish fork/team remotes and pushing to the frontend branch; no application behavior. |
| `b755e2f` | Adds authenticated `GET /user/journey`, controller, and five Neo4j reads/mappers for owner goals, experiences, goal links, and transitions. Establishes the owner journey response later copied by the public journey implementation. |
| `3c38205` | Introduces GitHub/PDF/image proof inspection, Gemini verification schema/prompt, PDF dependency, test driver, and certificate fixture. The fixture outlives the later deletion of its test driver. |
| `0843d78` | Restores backend files and deletes `journeyInsertion.service.ts`, reversing a competing frontend-side persistence implementation. Restores test script commands that can point to scripts removed by the new onboarding architecture. |
| `782c868` | Adapts the frontend to the flat owner journey response; builds Cytoscape graph HTML, profile language bottom sheet, web document shell and gesture root. Improves API error handling. This is API integration plus UI/platform work, not only animations. |
| `d34adcb` | Corrects one nonexistent `L.cream` token to `L.background`. |
| `94b6b4e` | Adjusts profile/card/nav/footer styling and removes an unused hero callback; introduces `slateMuted`. |
| `8f82e20` | Uses an iframe for Cytoscape on web while retaining native WebView. This platform distinction must survive extraction of shared graph code. |
| `8eda43b` | Restores editable username saving, supported Indian language choices, and temporary save-success ticks. |
| `63b592e` | Reads Clerk profile photos in owner/profile views and adds landing section dividers. |
| `52d56b6` | Extracts goal/experience cards and date display helpers, restructures full-journey into a directory, fixes HTML charset/reset styles, adjusts graph UI and TypeScript configuration. The extracted cards are placed under `app/full-journey/expandables.tsx`, where Expo treats them as a route. |
| `f13fbcf` | Removes direct `@clerk/backend`, updates `@clerk/express`, and adjusts the lockfile. |
| `c2ac249` | Generates/stores user summary and expertise; changes community ranking to goal matches and scored highlights; replaces public journey retrieval with the owner-style multi-query loading/mapping sequence. This introduces substantive duplication between `community.service.ts` and `user.service.ts`. |
| `21c9b38` | Changes Cytoscape node, edge, and force-layout settings for the full-journey graph. |
| `0b234d7` | Rebuilds landing copy/layout and adds verification/community sections and associated scroll presentation. |
| `4408133` | Changes landing/footer animated background interpolation. |
| `738b906` | Changes wrapper/layout coordinate handling for scroll-reveal sections so footer content becomes visible. |
| `00afd6a` | Replaces community filter controls with modal pickers, dependent topic/subtopic selection, refresh behavior, reputation cards, and loading presentation; changes navigation colors. |
| `e563b44` | Adds avatar fields/rendering in community/public views, keyboard dismissal in profile, and landing dividers. |
| `a3fbf03` | Rewrites the frontend lockfile without source changes. Treat as dependency-resolution churn, not a feature. |
| `90bdc1f` | Changes frontend CI installation from `npm ci` to `npm install`, weakening enforcement that the committed lockfile matches the manifest. |

### July 10

| Commit | Observed implementation and purpose |
| --- | --- |
| `230c40b` | Introduces a second `UI` token system beside existing `L`/brand tokens; adds shared card/button/divider/label components, Instrument Serif, and rewrites tab/results/profile/landing presentation. Existing contracts and event handlers are interleaved with the styling changes. |
| `36a9acc` | Rebuilds result presentation and collapsible insights, rearranges speech/translation handlers, adds optional schema fields and lockfile churn. Adds a full-journey action aimed at `/history`, a route later changed again. |
| `dd50770` | Revises the newly added tokens, adds Inter/JetBrains fonts, changes profile/hero/card presentation. This leaves several font families and overlapping token sets. |
| `fc53fa6` | Changes inverse surface color and restores the hero logo. |
| `cd3a72c` | Adds a Reanimated floating-particle component to the landing hero. |
| `ef4b1bf` | Replaces particle characters with animated bubbles and changes movement/opacity. |
| `c8ff41f` | Changes result journeys from timeline nodes to `expandedDetails` with goals/experiences/transitions; aligns skills and retrieval metadata; adds experience-duplicate checks, submission conversation ID and Redis cleanup; extracts date conversion. Also removes auth middleware from the query route. These are API/processing changes despite a vague title. |
| `7bad9f2` | Rebuilds the ask screen around input focus, recording, and suggested questions, removing an unused intent selector. |
| `5f7d34a` | Aligns community card fields with summary/expertise/highlight search results and redesigns public profiles. Replaces earlier avatar/type assumptions. |
| `c3f87c4` | Propagates Clerk `imageUrl` through user sync and graph persistence; adjusts seeds and related types. |
| `a21f80f` | Integrates Cloudinary storage into proof verification, uses the journey proof contract, removes the standalone verification schema, and changes configuration/prompt details. |
| `afcf622` | Moves full-journey rendering into the history tab and deletes `full-journey/index.tsx`; helper cards remain under the route directory. This is a route migration, not evidence that journey functionality became unused. |

### July 11–12

| Commit | Observed implementation and purpose |
| --- | --- |
| `2b38acd` | Revises landing trust/community and results-insight rendering; commits `latest_prompt.html`, a design scratch artifact later deleted. |
| `717487a` | Changes profile display-name fallback when no saved username exists. |
| `1ea5ede` | Replaces the old extraction call/fake chat with start/message/submit session APIs and a chat/form onboarding screen. Establishes the conversation ID and draft submission flow. |
| `9dead72` | Loads Manrope medium and adjusts landing typography and particle visibility. |
| `c1f79b6` | Adds guards for absent result timelines/public-user data and restores avatar rendering. |
| `6719d5a` | Adds seed profiles **and** authenticated translation/speech routes with database preferred-language lookup. Its “4 seed profiles” title omits that runtime/auth change. |
| `3f26072` | Copies AI draft experiences into editable state and submits the edited fields rather than the untouched draft. |
| `eb55a3f` | Adds an initial narrative input presentation and automatically opens the editable form after extraction while retaining chat history. |
| `59bc497` | Adds manual goal API/UI, goal assignment and decision-reason editing. Initially submits a goal body/response shape that subsequent commits must reconcile with the backend. |
| `4505e65` | Changes decision-reason field labeling to optional; backend handling is not fully aligned until later. |
| `7225838` | Moves goal creation from a modal into the onboarding form, removing modal state. |
| `e121573` | Fetches web recording URIs as Blobs before multipart audio upload; native keeps its separate file representation. The diff changes the audio API only, despite the title also mentioning timeline checks. |
| `fd3c6ba` | Adds more seeds **and** a capped reputation service invoked after goal creation and experience/verified-proof submission. |
| `4f8cf9d` | Replaces hardcoded local CORS origins with `CORS_ORIGINS`. |
| `ec3cbf0` | Adds request/auth/query debug logging, corrects speech endpoint path, renames history tab to journey, switches several screens back to `L` tokens, changes result navigation and landing visuals. |
| `5ab94ad` | Adds seeds, Node/npm engine constraints, and misspelled `.nprmc`/`.nvrmc` files. The filenames do not configure npm/nvm as intended. |
| `335cf0c` | Adds seeds, modifies dev-watch settings, extracts graph date conversion, and verifies proofs before creating experiences/reputation. Introduces an incorrect helper import and initially omits the verifier import. |
| `721fe99` | Adds the missing verifier import, but changes the helper path to `helper.jsjs`, still invalid. |
| `43f44bf` | Corrects `helper.jsjs` to `helper.js`. |

### July 13

| Commit | Observed implementation and purpose |
| --- | --- |
| `ed3aa5f` | Changes background presentation, engine files, submit button behavior, result rendering, and output-language overrides/fallbacks; introduces `patch.diff`/temporary landing files. |
| `22a99b9` | Adds feed/upvote/graph API routes and processors; replaces community browsing with an Explore screen; adds public graph rendering, error boundary, result pagination/playback, and draft persistence. Also fixes the journey-start response shape. Several new paths are later removed or restored by competing work. |
| `824ab05` | Adds seeds, propagates image URL through community/owner/query journey responses, and excludes seed JSON/raw data from TypeScript compilation. |
| `2f406f0` | Moves database assets from `backend/src/db` to `backend/db`, updates the seed-loader path, and adds profiles. This move is subsequently partially undone by restoration work. |
| `44e1749` | Adds three seed journeys/raw sources, updates another seed and removes selected raw source documents; no runtime code diff. |
| `ecd6ce1` | Changes journey submission to multipart, adds submitted-proof schema separate from verified-proof schema, parses a `journey` JSON envelope, and attempts uploaded-file association. |
| `387f986` | Maps multipart fields to in-memory files by proof ID, uses Cloudinary upload streams, separates submitted/verified proof typing and normalization, and adjusts transition construction. |
| `f859df5` | Much more than colors: adds automatic username generation, a diagnostic script named `backfill-usernames`, file/photo/link proofs, graph selection/export/sharing in owner/public screens, reusable press/badge components, dependencies, and scratch files. The “backfill” script actually only reads/logs users. Parallel Cytoscape implementations expand here. |
| `629c92f` | Normalizes caught-error messages/proof nullable fields and deletes the proof verification test driver. |
| `be98993` | Adds nullable proof normalization again at journey normalization, reinforcing the same boundary in two places. |
| `23c7571` | Replaces base64 proof payloads with local file metadata and multipart file fields; teaches shared API client multipart headers; changes proof labels. Payload keys still require the later correction. |
| `ce3533d` | Restores backend snapshots after merging frontend work. Reintroduces `backend/src/db` alongside `backend/db`, changes the loader path back, and reverses image URL/username changes while preserving feed/upvote/graph work. This explains a large portion of final-commit deletions. |
| `e72184b` | Restores a competing frontend snapshot: removes community tab and press/badge components, changes public/owner graphs and API types, and reverses export/picker/dependency work. |
| `e95f9e1` | Re-adds image/document picker packages missing from that restored frontend manifest. |
| `b185fd3` | Reverses `e72184b`: restores community, graph/export code, components, assets and API/type choices. This is restoration churn rather than an independent feature. |
| `b77bfde` | Reintroduces graph/feed/upvote API interfaces deleted by the revert; switches graph-export screens to `expo-file-system/legacy` and fixes icons/types. |
| `a4b5e91` | Normalizes output language/speaker input, permits empty insight key points, repairs Cypher upvote count expressions, and updates frontend translated-insight rendering/default speaker. |
| `08f7e0e` | Removes frontend upvoting and its API wrapper, replaces emoji presentation, deletes `temp.tsx`. **Backend feed/upvote routes remain exposed** and are not dead code solely because their UI disappeared. |
| `c4a4e32` | Prevents journey-start reruns caused by the token getter dependency, tolerates missing translation/TTS fields, caps speech text, and removes the prompt HTML artifact. |
| `d2bebe1` | Wraps goal requests in `{ goal }` and uses the exact backend `journey` JSON envelope for both multipart and JSON submissions. |
| `62f7cb5` | Adds EAS development/preview/production profiles with backend API URL. |
| `6e360f2` | Adds Expo update package/project identity/channels and an automatic deployment workflow. |
| `18cdfa1` | Switches deployment trigger from frontend branch to main. |
| `022efc9` | Changes production Android build type to APK. |
| `46b1d9c` | Moves commit-message interpolation into an environment variable for the deployment command. |
| `efff924` | Adds Vercel SPA rewrites so client routes resolve through `index.html`. |
| `8fae64f` | See detailed breakdown below: combines product behavior, upload/date/audio changes, marketing site, deployment configuration, documentation, assets, dependencies, and prior-artifact cleanup in 179 files. |

## Merge integration ledger

### Before July 6

Parent/file comparisons identify which implementation enters each branch. Most merges have no combined source diff beyond inherited changes; the notable combined resolutions are called out explicitly. The table avoids counting imported work as a second implementation.

| Commit | Integration observed |
| --- | --- |
| `ceb9c80` | Combines initial README with the workflow branch. |
| `5fb607b` | Applies backend-only CI to the newly moved backend package. |
| `596c14e` | Integrates backend scaffolding, monorepo move and CI whitespace changes through `1fd5f9d`. |
| `14fd87b` | Brings that main state into the graph-design branch. |
| `5e294bf` | Integrates graph documentation revisions through `72c3ab6`. |
| `95d666e` | Brings the PR template into the Neo4j implementation branch. |
| `4343906` | Integrates Neo4j configuration/migrations and strictness guards through `ba5d521`. |
| `d07e45b` | Integrates Gemini/Groq provider scaffolding (`610fb8e`). |
| `4b19a98` | Integrates graph/seed/embedding/query-understanding work through `4043528`. |
| `db524b0` | Integrates the query pipeline (`20470f9`). |
| `ec5db5c` | Integrates Sarvam provider support (`59563b9`). |
| `78cb109` | Integrates query audio/translation/speech work (`1b12cbf`). |
| `ecc4dd9` | Integrates Expo setup, relocation, Clerk UI and mocked screens through `7e958f2`. |
| `b8e6f82` | Brings Sarvam/query changes into the flowchart frontend branch. |
| `1330c6e` | Integrates multipart input and separated output processing (`874878d`). |
| `9fa263e` | Brings that multipart/output contract into the frontend branch. |
| `cff697d` | Reconciles frontend branch lineage after live query wiring; no additional combined source change. |
| `9647ba0` | Integrates frontend flowchart/live-query changes through `cff697d`. |
| `fb85322` | Updates the frontend artifact-cleanup branch with the integrated main state. |
| `ac2d979` | Integrates artifact cleanup and frontend documentation (`f10c503`). |
| `7c6887f` | Integrates the Expo Router entry/configuration correction (`f8c230f`). |
| `af0a350` | Integrates live schema alignment, frontend fixes/redesign and README revisions through `731695c`. |
| `23766e5` | Integrates backend and frontend Clerk synchronization (`18304c8`). |
| `8ee3147` | Resolves landing auth initialization together with new tabs: preserves token/user synchronization but directs existing/new profiles to `/(tabs)` or `/(tabs)/profile` instead of the deleted dashboard/profile routes. |
| `8807ba7` | Integrates NativeWind/tabs, merged auth navigation and CSS type declaration through `03f80f8`. |
| `4cb9548` | Combines frontend authenticated API integration with that main state. |
| `fc72cee` | Integrates the authenticated frontend wrapper/profile-save branch. |
| `d7c0468` | Brings that integration into the output/follow-up frontend branch. |
| `e834631` | Integrates output/follow-up work and corrected voice endpoint/multipart transport through `50f4c3f`. |
| `32cd207` | Integrates whole-narrative journey extraction (`31e606b`). |
| `cc07fd9` | Integrates community services/routes and filename casing fix through `9c429ed`. |
| `11b288c` | Integrates live community UI and guarded back navigation through `ffbd41d`. |
| `4609f8a` | Integrates mock follow-ups, null/integer/key fixes and further NativeWind conversion through `8e7ce4b`. |
| `b97a80e` | Brings that community/frontend state into the normalization/static-analysis branch. |
| `30d94f8` | Reconciles the repeated visual-redesign branch with integrated frontend state; no additional combined source change. |
| `8aee2f9` | Integrates schema validation, normalization/static analysis, conversation validator and existing-graph retrieval through `2396486`. |
| `48747b9` | Combines validation changes with custom authentication middleware; combined query-route resolution keeps `requireAuth` as middleware while accepting formatting changes. |
| `d868692` | Reconciles the extracted editorial landing design with the prior visual-redesign lineage. |
| `18b2832` | Combines auth/browser/linking/worklets dependencies with Manrope/font/splash additions and updates the lockfile. Expo 57 font/splash versions survive this merge until `b70b2c3` corrects them. |
| `f0e51ad` | Integrates the new landing sections and Expo dependency correction through `b70b2c3`. |
| `c216c10` | Brings that frontend/landing state into the backend architecture branch. |
| `9115e7e` | Integrates landing animation/context/assets (`9007deb`). |

### July 6–13

The following inventories all 38 merges without counting already-described feature changes twice. Parent diffs identify what entered the destination branch; combined diffs identify files changed relative to both parents. A merge title alone is not evidence that it was review-only or conflict-free.

| Merge | Integrated work / merge-specific observation |
| --- | --- |
| `6c55789` | Brings July 5 `ed43924` onboarding rewrite into main. |
| `956207c` | Brings the new backend architecture into frontend branch. |
| `1ac0e33` | Integrates owner journey API (`b755e2f`). |
| `36dcd15` | Integrates owner API/main changes into the working frontend lineage. |
| `402c386` | Integrates frontend work through `d34adcb`. |
| `eb81a30` | Integrates proof verification (`3c38205`). |
| `2ed52e9` | Integrates profile/nav/landing work (`94b6b4e`). |
| `c35eabc` | Combines profile username/photo editing with upstream card/nav changes; combines landing dividers with the removed hero callback. |
| `6bf220b` | Integrates that combined frontend state. |
| `9c1dd40` | Integrates full-journey cards/helpers and configuration (`52d56b6`). |
| `742d310` | Integrates dependency fix (`f13fbcf`). |
| `2818fc1` | Integrates community/summary contract rewrite (`c2ac249`). |
| `579c111` | Integrates July 8 frontend changes through `90bdc1f`. |
| `b78752e` | Integrates July 10 UI/token redesign through `ef4b1bf`. |
| `ea4e1b8` | Integrates query/retrieval/submission changes (`c8ff41f`). |
| `ad24951` | Integrates persisted avatars (`c3f87c4`). |
| `02f6a64` | Integrates Cloudinary verification (`a21f80f`). |
| `00dda68` | Brings those backend changes into frontend lineage. |
| `0fd2403` | Integrates seeds and authenticated output language lookup (`6719d5a`). |
| `4da4653` | Brings that backend state into frontend lineage. |
| `fae0126` | Integrates seeds, reputation writes, and environment CORS. |
| `c143ca4` | Resolves server changes by retaining both CORS configuration and added request logging. |
| `5b91de0` | Integrates frontend work through `e121573`; later work on the frontend branch still has to be merged. |
| `7089777` | Integrates seeds and engine setup (`5ab94ad`). |
| `f1b7cfa` | Brings that backend/main state into frontend lineage. |
| `77767bc` | Integrates proof verification wiring/import corrections through `43f44bf`. |
| `e1b4de4` | Combines package changes from backend with frontend engine/background work. |
| `4a63e14` | Integrates seed/image metadata changes (`824ab05`). |
| `ca60cf8` | Integrates database directory relocation (`2f406f0`). |
| `b198495` | Integrates seed changes (`44e1749`). |
| `ff6afef` | Integrates multipart proof pipeline through `be98993`. |
| `9cc3c70` | Combines two competing frontend implementations. Journey tab incorporates graph-selection/export additions, API helper/dependency changes are reconciled, and the merged owner graph temporarily loses its iframe branch. Follow-on restore/revert commits materially alter this result. |
| `c27ac49` | Integrates frontend restoration/dependencies into main; combined controller diff preserves the corrected journey-start response alongside multipart controller work. Also brings duplicated database directory back. |
| `f311e70` | Brings main's multipart/proof fixes into the restored frontend lineage. |
| `37184df` | Integrates output normalization/Cypher/result changes (`a4b5e91`) into frontend; lockfile also reconciled. |
| `a5b8916` | Integrates restored community/export UI and runtime fixes through `c4a4e32`. |
| `e76a938` | Reconciles main with submission/EAS work; no additional first-parent file change. |
| `9209ab8` | Integrates final payload and deployment work through `efff924`, immediately before the large final commit. |

## The final July commit is not a cleanup-only commit

`8fae64f` has **179 changed files, 11,163 insertions and 27,824 deletions**. Deletion count is inflated by removing the duplicated `backend/src/db` tree and raw seed narratives, earlier graph documentation, temporary frontend/design files, and output audio. The retained `backend/db/journeys` files remain application maintenance data.

Its independent behavior changes include:

1. Adds the Vite marketing site with its own package/build, assets, components, and CSS. Retains Expo's authentication landing experience.
2. Changes the tab routes to Ask/Journey/Community/Profile, deletes Explore, and folds the trending graph into Community. The frontend feed wrapper becomes unreferenced while the backend feed/upvote API remains reachable.
3. Replaces `expo-av` recording/playback with `expo-audio`, changes Expo package versions/plugins and EAS identity, adds web export support, and deletes the recently added deployment workflow.
4. Changes proof transport from a map of proof-ID file fields to **one** `proof` file, with a matching Multer single-file route and direct upload fetch. The submission JSON envelope remains significant.
5. Changes accepted onboarding dates from textual `MMM YYYY` to numeric `MM YYYY` across schema, prompt, and Neo4j conversion.
6. Supports both narrative and manually titled goals, including existing default categories/status/date behavior. Makes final journey transition handling skip unresolvable/missing-reason transitions instead of failing the whole submission.
7. Groups query timeline entries by matched owner and counts only owners with matched experiences; includes avatars and passes query-specific `expandedDetails` into public journey navigation.
8. Repairs web/native graph message bridges and export branches in **two copied screen implementations**; refreshes the owner journey on focus.
9. Bypasses translation for English output and changes the Gemini/Groq model strings. These are runtime behavior changes, not formatting.
10. Adds duplicate Android permission entries, unconditional frontend diagnostic logs, and a manual test script using a hardcoded user ID; replaces detailed old graph documentation with broader docs that include claims inconsistent with runtime code.

At the baseline, the seed uploader path is stale after deleting `backend/src/db`: `ce3533d` had restored `../db/journeys`, but `8fae64f` does not move it back to `../../db/journeys`. Migration constraints/index paths have the same directory problem. The maintenance cleanup corrects both scripts to resolve `../../db` relative to the script directory, which works from both `src/scripts` and `dist/scripts`. The retained seed data has a separate date-schema incompatibility described below.

## Concrete cleanup candidates and preservation checks

| Baseline location | Evidence / appropriate action | Verification |
| --- | --- | --- |
| `frontend/app/(tabs)/journey.tsx`, `frontend/app/u/[username].tsx` | Duplicated graph HTML, graph elements, message bridge, export, selected-node details, and timeline rendering grew in parallel. Share the common representation while preserving different data loading, headings, export names, and query-subset mode. | Owner/public/query-subset graphs; web iframe messages/download; native WebView selection/sharing; loading/error/empty states. |
| `frontend/app/full-journey/expandables.tsx` | Helper-only module is inside Expo's route tree. Move into `components/journey` and update its consumers. | Router export/build; ensure no valid product route is removed. |
| `backend/src/services/user.service.ts`, `community.service.ts` | Public and owner journey readers duplicate entity mapping. Share pure mappers first or a carefully parameterized loader; retain public upvote/proof fields and owner/public response differences. | Fixtures for dates, nulls, skills, goal links and transitions; preserve authorization entry points and query count. |
| `frontend/api/community.api.ts` | `getGlobalFeed` and `FeedExperience` outlive the removed Explore consumer. They are private frontend exports, unlike the still-public backend endpoint. | Whole-repository import/reference scan, TypeScript build. |
| `backend/src/utils/auth 2.ts`, old journey types, unused UI wrappers/helpers | Historical modules survive replacement of their call sites. `auth 2.ts` comes from the July 5 rewrite; reusable components require individual usage checks (for example `DarkCard` is still used). | Static references plus package scripts, dynamic imports, framework conventions and public API boundaries. |
| `backend/package.json`, `backend/src/scripts/uploadSeedJourneys.ts`, `.nprmc`, `.nvrmc` | Commands/path/config filenames drifted during architecture rewrites and database moves. | Check every script target and resolve source/compiled data paths without invoking live database writes. |
| `frontend/app/share-journey.tsx` | One screen mixes draft state, goals, uploads, transport shaping, modal dialogs and large form markup; retains dead state/imports from earlier iterations. Extract only cohesive reused logic and presentation with clear types. | Draft editing, goal association, URL/photo/PDF proof payloads, single-file transport, optional decision reason, submission navigation. |
| `frontend/constants/colors.ts`, fonts/imports | Several design generations coexist. Remove only unreferenced tokens/exports; changing live values changes the design. | TypeScript/import scan and representative screenshots. |
| `backend/src/controllers/query.controller.ts`, frontend root layout | Debugging commits log uploaded file/query structures or update/key metadata unconditionally. Remove temporary success/data dumps while preserving useful errors. | Same request/response behavior; no important operational error lost. |
| Documentation | Final docs refer to workflow orchestration, graph relationship names, and paths not matching code. Document the actual processors/services, Redis sessions/cache and graph relations. | Compare docs with route mounting, Cypher writers, dependencies and startup commands. |

Do not remove the backend feed/upvote endpoints, seed tooling, separate marketing app, or supported routes just because an import counter says zero. Entry points and externally exposed APIs require separate reachability reasoning. Existing questionable behavior—such as one-file proof upload or placeholder display text—is recorded for future product work; silently redesigning it would exceed a behavior-preserving cleanup.

## Existing functional issues kept separate from cleanup

These are baseline findings, not regressions introduced by deduplication. They need focused fixes and contract tests rather than being hidden inside structural refactoring:

- `backend/src/services/journeySession.service.ts` creates, reads and updates `journey:${conversationId}`, but deletes `journey_session:${conversationId}`. The mismatched delete key was introduced in `c8ff41f`; successful submission therefore does not delete the actual session key, which instead expires under its TTL.
- `backend/src/controllers/community.controller.ts` reads `(req as any).auth.userId` in journey/feed/upvote handlers. The installed `@clerk/express/env.d.ts` declares `req.auth` as a function, while existing `auth.middleware.ts` correctly uses `getAuth(req)`. The community handlers' object assumption originates in `22a99b9`; authenticated personalization/upvoting needs a separate correction and auth tests. The routes should not be removed to mask this issue.
- All **30 retained seed JSON files** use textual dates such as `Jan 2000`, incompatible with the numeric `MM YYYY` journey schema introduced July 13. A read-only validation against the current schema found only date errors: 192 goal start dates, 156 goal end dates, 481 experience start dates, and 442 experience end dates (1,271 errors total). Correcting the script paths does not migrate those records. Datasets remain unchanged; date conversion requires a separate, validated data-format migration before uploads can succeed.
- The final single-file upload contract passes the same `proofFile` into verification for each submitted proof. Supporting independent files per proof again requires coordinated frontend payload, Multer, controller and verifier changes; it is not an internal-only cleanup.
- Owner/public journey cards contain fallback organization `TechNova Global` and fallback subtopics `Microservices`/`Event-Driven`. These can misrepresent incomplete records, but changing visible content is a distinct product correction.
- Query-subset graph data can contain relations to entities absent from the subset. Existing public-screen filtering handles missing transition endpoints; broader graph-contract validation should be assessed separately rather than silently changing query relevance or returned records.

## Later commits

- `e2c3e50` (August 29) adds a daily 00:00 UTC/manual GitHub workflow using Node 22, `npm ci`, three Neo4j repository secrets, and `npm run neo4j:keepalive`. The script validates environment variables, dynamically loads the existing driver/session services, runs `MERGE (k:KeepAlive {id: 1}) SET k.lastSeen = datetime()`, checks the returned record, and closes connections. It is an active operational write entry point and should remain.
- `09cd4a7` updates that workflow's checkout/setup-node actions from v4 to v5. No application source behavior changes.

This audit is a maintenance map, not proof that live integrations or every historical commit are defect-free. Runtime validation needs controlled API fixtures and, where available, authenticated web/native and external-service smoke checks.
