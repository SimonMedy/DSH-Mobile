import {createServer} from 'node:http';

// Local auth protocol fixture only. It is not a full Harness implementation.
const port = 3080;
const token = 'fixture-only-test-token';
const cookieName = 'dsh-auth-fixture';
const stats = {tokenExchanges: 0, cookieLoads: 0, denied: 0};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  if (url.pathname === '/__fixture/status') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(stats));
    return;
  }
  if (req.method !== 'GET' || url.pathname !== '/') {
    res.writeHead(404);
    res.end();
    return;
  }
  const validToken = url.searchParams.get('token') === token;
  if (url.searchParams.size === 1 && validToken) {
    stats.tokenExchanges += 1;
    res.writeHead(303, {
      'Set-Cookie': `${cookieName}=yes; Path=/; HttpOnly; SameSite=Strict`,
      Location: './',
      'Cache-Control': 'no-store',
    });
    res.end();
    return;
  }
  const cookies = (req.headers.cookie ?? '').split(';');
  const hasCookie = cookies.some(item => item.trim() === `${cookieName}=yes`);
  if (hasCookie) {
    stats.cookieLoads += 1;
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end('<h1>HARNESS_AUTHENTICATED_FIXTURE</h1>');
    return;
  }
  stats.denied += 1;
  res.writeHead(401, {'Content-Type': 'text/plain'});
  res.end('Authentication required');
}).listen(port, '127.0.0.1', () => {
  console.log('Harness auth fixture listening on 127.0.0.1:3080');
});
