import {createServer} from 'node:http';

// Minimal local Harness browser-auth contract, NOT a replacement for testing
// an actual upstream release. Only reachable through adb reverse in CI.
const port = 3080;
const token = 'fixture-only-test-token';
const cookieName = 'dsh-auth-fixture';
const stats = {tokenExchanges: 0, cookieLoads: 0, denied: 0};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  if (url.pathname === '/__fixture/status') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(stats));
    return;
  }
  if (req.method !== 'GET' || url.pathname !== '/') {
    res.writeHead(404);
    res.end();
    return;
  }
  if (url.searchParams.size === 1 && url.searchParams.get('token') === token) {
    stats.tokenExchanges += 1;
    res.writeHead(303, {
      'Set-Cookie': `${cookieName}=yes; Path=/; HttpOnly; SameSite=Strict`,
      Location: './',
      'Cache-Control': 'no-store',
    });
    res.end();
    return;
  }
  if (
    req.headers.cookie
      ?.split(';')
      .some(item => item.trim() === `${cookieName}=yes`)
  ) {
    stats.cookieLoads += 1;
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    });
    res.end(
      '<!doctype html><html><body><h1>HARNESS_AUTHENTICATED_FIXTURE</h1><p>Cookie accepted.</p></body></html>',
    );
    return;
  }
  stats.denied += 1;
  res.writeHead(401, {'Content-Type': 'text/plain', 'Cache-Control': 'no-store'});
  res.end('Authentication required');
}).listen(port, '127.0.0.1', () => {
  console.log('Harness auth fixture listening on 127.0.0.1:3080');
});
