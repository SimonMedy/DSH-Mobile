import {
  canPreflightConnection,
  checkServerConnection,
} from '../src/features/servers/connection';

describe('server connection checks', () => {
  it('treats any HTTP response as network reachability', async () => {
    const fetchImpl = jest.fn(async () => ({
      status: 401,
    })) as unknown as typeof fetch;
    const result = await checkServerConnection('https://dsh.example.com', {
      fetchImpl,
      platform: 'android',
    });

    expect(result.reachable).toBe(true);
    expect(result.httpStatus).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
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
