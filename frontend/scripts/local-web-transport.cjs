// Large compressed development bundles can stall in Node's shared worker pool
// on Windows. Loopback transfers are faster without compression; keep normal
// negotiation for devices on the LAN, native bundles, and production requests.
function localWebTransport(middleware) {
  return (request, response, next) => {
    const address = request.socket?.remoteAddress;
    const loopback = address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
    const url = new URL(request.url || '/', 'http://localhost');
    if (loopback && url.pathname.endsWith('.bundle') &&
        url.searchParams.get('platform') === 'web' && url.searchParams.get('dev') === 'true') {
      request.headers['accept-encoding'] = 'identity';
    }
    return middleware(request, response, next);
  };
}

module.exports = { localWebTransport };
