const { spawn } = require('node:child_process');

function expoEnvironment(environment) {
  // Metro's filesystem operations and compression share Node's worker pool.
  // The default pool stalled both on this Windows workspace. Set the size before
  // Expo starts: changing it inside metro.config.js is too late on Windows.
  return { ...environment, UV_THREADPOOL_SIZE: environment.UV_THREADPOOL_SIZE || '16' };
}

function startExpo(args = process.argv.slice(2)) {
  const environment = expoEnvironment(process.env);
  console.log(`[PathFinder] Expo worker pool: ${environment.UV_THREADPOOL_SIZE}`);
  const child = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start', ...args], {
    stdio: 'inherit',
    env: environment,
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => { if (!child.killed) child.kill(signal); });
  }
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}

if (require.main === module) startExpo();
module.exports = { expoEnvironment };
