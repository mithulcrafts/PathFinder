# Local web startup investigation

## Follow-up: localhost compression stalls returned

On 2026-11-13, the existing server on port 8082 again delivered compressed
bundles slowly despite using the project launcher. The browser recorded about
38 seconds before React mounted and 40 seconds before fonts were ready.
The standalone HTTP probe reproduced the delay without Google authentication:

| Request on port 8082 | Before | After restarting with loopback bypass |
| --- | ---: | ---: |
| Browser-style encoding negotiation | 38,012 ms (Brotli) | 2,855 ms (first bundle, identity) |
| Explicit gzip negotiation | 39,463 ms (gzip) | 217 ms (warm bundle, identity) |
| Explicit identity negotiation | 717 ms | 148 ms |

The before-change identity response spent only 16 ms transferring its body;
the compressed responses spent 36–38 seconds there. This isolates the dominant
observed delay to the local compressed response path, not the public internet.
Restarting also improved server response times, so the after measurements include
both the restart and transport change. The precise cause of recurring worker-pool
contention has not been established; increasing the pool alone was insufficient.

`scripts/local-web-transport.cjs` now asks Metro to serve uncompressed bundles
only for loopback web requests with `dev=true`. It preserves the NativeWind
middleware chain. LAN/native requests and production exports retain their usual
behavior. The tradeoff is about 9.9 MB over loopback instead of 1.7–1.8 MB
compressed; no extra internet bandwidth is used for these local bundle requests.
The same development bundle serves the OAuth callback, so this stall also
delayed completion of Google sign-in.

Browser startup diagnostics now include `session-ready`, `session-token-ready`,
and `account-ready`, separating Clerk initialization and backend account sync
from asset loading without logging credentials or user data.

One authenticated browser navigation after the change measured:

- Bundle response: 240 ms.
- React mounted: 2,309 ms from navigation start.
- Fonts ready: 2,747 ms.
- Clerk session ready: 4,072 ms; token ready: 4,077 ms.
- Backend account sync complete: 7,633 ms, then navigation to Ask succeeded.

These are development measurements, not a guarantee of sub-second login.
Account sync alone still took about 3.56 seconds and includes remote Clerk and
database work. Its individual server stages and Google's interactive login time
were not measured. Internet conditions can affect those remaining round trips.

## Initial investigation

Measured on 2026-11-11 against `http://localhost:8081/`. HTTP timings below are
separate from browser startup phases and authenticated login/logout timings.

## Finding

The local Expo server's default Node worker pool was a bottleneck for both
compressed bundle delivery and font file reads. Warm Metro compilation was
approximately 50 ms, but the compressed response took tens of seconds.

| Measurement | Before | Final configuration |
| --- | ---: | ---: |
| Gzip bundle, complete HTTP request | 34,715 ms | 263 ms |
| Gzip body delivery | 33,705 ms | 205 ms |
| Individual font HTTP request | 2,724–3,380 ms | 4–8 ms in isolated comparison |
| Browser font-loading phase after React mounted | 5,795 ms | 69 ms |
| Final browser root mounted, from navigation start | — | 686 ms |
| Final browser fonts ready, from navigation start | — | 755 ms |

The bundle was approximately 9.9 MB decoded and 1.8 MB with gzip. Compression
remains enabled in the final version. A comparison server with 16 workers also
delivered a warm Brotli response in 208 ms and a gzip response in 273 ms.
The first bundle request after restarting the final server took 1,556 ms,
including initial compilation. Cold compilation after edits can still take longer.

The configured backend's public health endpoint returned in 148 ms and 5 ms.
This does not measure Clerk or the authenticated `/auth/sync` operation.

## Options compared

1. **Split or shrink the bundle:** reduces bytes, but does not address the measured
   worker contention affecting small font files too.
2. **Use a production preview:** avoids development overhead, but changes the
   workflow and does not fix the requested development URL.
3. **Disable local compression:** tested successfully for bundle delivery, but
   left font requests waiting roughly 3 seconds and transferred more bytes.
4. **Increase Expo's worker pool before startup:** fixed both bottlenecks while
   retaining normal compression and application behavior. This is the final fix.

Node's asynchronous filesystem and zlib operations share a worker pool. The
[Node documentation](https://nodejs.org/download/release/latest-v20.x/docs/api/cli.html#uv_threadpool_sizesize)
describes how contention can delay otherwise unrelated operations.
`scripts/start-expo.cjs` launches Expo with `UV_THREADPOOL_SIZE=16` before its
process starts. An explicit existing setting is respected. This changes only the
development server's process environment, not the machine's settings or the UI.
The temporary compression middleware was removed.

## Run and measure

From `frontend`, use the project launcher so the setting takes effect:

```sh
npm start
# Or, to open the web development target:
npm run web
```

In another terminal:

```sh
npm run perf:web -- http://localhost:8081/
```

The read-only probe prints document and entry-script timings for browser-style
compression negotiation, explicit gzip, and identity encoding. It sends no
credentials and does not call authenticated APIs. Development browser logs marked
`[PathFinder startup]` record root mounting, font readiness, and asset timings
without logging tokens, user data, or URL query strings.

Restart the server when changing its launch configuration. Running `npx expo start`
directly bypasses the project launcher; use the npm scripts above for this fix.
Google/Clerk and database round trips still require authenticated measurements;
do not infer their latency from these startup results.
