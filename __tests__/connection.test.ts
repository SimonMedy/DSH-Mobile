import {
  canPreflightConnection,
  checkServerConnection,
} from '../src/features/servers/connection';

describe('server connection checks', () => {
  it('treats 2xx, 3xx and 4xx HTTP responses (like 401/403) as reachable', async () => {
    const fetchImpl = jest.fn(async () => ({
      status: 401,
    })) as unknown as typeof fetch;
    const result = await checkServerConnection('https://dsh.example.com', {
      fetchImpl,
      platform: 'android',
    });

    expect(result.reachable).toBe(true);
    expect(result.httpStatus).toBe(401);
    expect(result.error).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('treats 5xx server errors (like 502 Bad Gateway) as unreachable', async () => {
    const fetchImpl = jest.fn(async () => ({
      status: 502,
    })) as unknown as typeof fetch;
    const result = await checkServerConnection('https://dsh.example.com', {
      fetchImpl,
      platform: 'android',
    });

    expect(result.reachable).toBe(false);
    expect(result.httpStatus).toBe(502);
    expect(result.error).toContain('HTTP 502');
  });

  it('skips native cleartext preflight on iOS while leaving WebView verification possible', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    const result = await checkServerConnection('http://100.64.0.1:3080', {
      fetchImpl,
      platform: 'ios',
    });

    expect(canPreflightConnection('http://100.64.0.1:3080', 'ios')).toBe(false);
    expect(result.skipped).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('allows HTTPS preflight on iOS', () => {
    expect(canPreflightConnection('https://dsh.example.com', 'ios')).toBe(true);
  });
});
