import {parseHarnessLaunchLink} from '../src/features/servers/launchLink';

describe('DSH Web startup link', () => {
  it('extracts the persistent non-secret endpoint and preserves the one-time URL in memory', () => {
    expect(
      parseHarnessLaunchLink('https://harness.example/?token=temporary-secret'),
    ).toEqual({
      serverUrl: 'https://harness.example',
      launchUrl: 'https://harness.example/?token=temporary-secret',
    });
  });

  it('supports HTTPS reverse proxy mount prefixes', () => {
    expect(
      parseHarnessLaunchLink('https://harness.example/dsh/?token=abc'),
    ).toEqual({
      serverUrl: 'https://harness.example/dsh',
      launchUrl: 'https://harness.example/dsh/?token=abc',
    });
  });

  it('accepts a local development URL but not a public HTTP token', () => {
    expect(
      parseHarnessLaunchLink('http://127.0.0.1:3080/?token=abc').serverUrl,
    ).toBe('http://127.0.0.1:3080');
    expect(() =>
      parseHarnessLaunchLink('http://public.example/?token=abc'),
    ).toThrow('A remote launch token requires HTTPS.');
  });

  it('rejects credential-looking URLs and unintended query parameters', () => {
    for (const link of [
      'https://harness.example/?token=one&token=two',
      'https://harness.example/?token=abc&next=https://evil.example',
      'https://user:password@harness.example/?token=abc',
      'https://harness.example/?token=abc#fragment',
      'javascript:alert(1)',
      'https://harness.example/session?token=abc',
      'https://harness.example/?token=',
    ]) {
      expect(() => parseHarnessLaunchLink(link)).toThrow();
    }
  });
});
