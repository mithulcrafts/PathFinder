// Read-only timing probe: compare transfer time with browser-style compression
// negotiation and identity encoding. No authentication or API data is accessed.
const http = require('node:http');
const https = require('node:https');
const { performance } = require('node:perf_hooks');
const { gunzipSync, brotliDecompressSync, inflateSync } = require('node:zlib');

function measure(url, encoding) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const request = (url.protocol === 'https:' ? https : http).get(url, {
      headers: { 'Accept-Encoding': encoding },
    }, response => {
      const headersAt = performance.now();
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve({
        body: Buffer.concat(chunks),
        stats: {
          status: response.statusCode,
          requestedEncoding: encoding,
          responseEncoding: response.headers['content-encoding'] || 'identity',
          headersMs: Math.round(headersAt - started),
          bodyMs: Math.round(performance.now() - headersAt),
          totalMs: Math.round(performance.now() - started),
          wireBytes: chunks.reduce((total, chunk) => total + chunk.length, 0),
        },
      }));
    });
    const timeout = setTimeout(() => request.destroy(new Error('Response exceeded 90 seconds')), 90_000);
    request.on('close', () => clearTimeout(timeout));
    request.on('error', reject);
  });
}

function decode(result) {
  switch (result.stats.responseEncoding) {
    case 'gzip': return gunzipSync(result.body);
    case 'br': return brotliDecompressSync(result.body);
    case 'deflate': return inflateSync(result.body);
    default: return result.body;
  }
}

async function main() {
  const base = new URL(process.argv[2] || 'http://localhost:8081/');
  const html = await measure(base, 'identity');
  console.log(JSON.stringify({ resource: 'document', ...html.stats }));
  if (html.stats.status !== 200) throw new Error('Homepage did not return 200');
  const scripts = [...decode(html).toString().matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map(match => match[1].replaceAll('&amp;', '&'));
  const entry = scripts.find(src => src.includes('.bundle') || src.includes('/_expo/static/js/'));
  if (!entry) throw new Error('No Expo entry script found');
  for (const encoding of ['gzip, deflate, br', 'gzip', 'identity']) {
    const result = await measure(new URL(entry, base), encoding);
    console.log(JSON.stringify({ resource: 'entry-script', ...result.stats, decodedBytes: decode(result).length }));
  }
}

main().catch(error => { console.error(error.message || String(error)); process.exitCode = 1; });
