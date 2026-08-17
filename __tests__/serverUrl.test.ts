import {
  buildServerUrl,
  classifyEndpointSecurity,
  normalizeServerUrl,
  splitServerUrl,
} from '../src/features/servers/serverUrl';

describe('server URL utilities', () => {
  it('defaults to HTTPS and strips a trailing slash', () => {
    expect(normalizeServerUrl('dsh.example.com/')).toBe(
      'https://dsh.example.com',
    );
  });

  it('preserves a reverse-proxy base path', () => {
    expect(normalizeServerUrl('https://example.com/dsh/')).toBe(
      'https://example.com/dsh',
    );
  });

  it('rejects embedded credentials', () => {
    expect(() => normalizeServerUrl('https://user:secret@example.com')).toThrow(
      /Credentials/,
    );
  });

  it('builds and splits an endpoint', () => {
    const url = buildServerUrl({
      scheme: 'http',
      host: '100.64.0.12',
      port: '3080',
      path: '',
    });
    expect(url).toBe('http://100.64.0.12:3080');
    expect(splitServerUrl(url)).toEqual({
      scheme: 'http',
      host: '100.64.0.12',
      port: '3080',
      path: '',
    });
  });

  it('recognizes Tailscale address space and MagicDNS names as private', () => {
    expect(classifyEndpointSecurity('http://100.100.10.20:3080').kind).toBe(
      'private-http',
    );
    expect(
      classifyEndpointSecurity('http://workstation.example-tailnet.ts.net:3080')
        .kind,
    ).toBe('private-http');
  });

  it('rejects query parameters, fragments, dangerous schemes, and invalid ports', () => {
    expect(() =>
      normalizeServerUrl('https://example.com/?token=secret'),
    ).toThrow(/query or fragment/);
    expect(() => normalizeServerUrl('https://example.com/#session')).toThrow(
      /query or fragment/,
    );
    expect(() => normalizeServerUrl('javascript:alert(1)')).toThrow();
    expect(() =>
      buildServerUrl({
        scheme: 'https',
        host: 'example.com',
        port: '70000',
        path: '',
      }),
    ).toThrow(/Port/);
  });

  it('rejects full URLs, embedded ports, and paths in the Host field', () => {
    expect(() =>
      buildServerUrl({
        scheme: 'https',
        host: 'https://example.com',
        port: '',
        path: '',
      }),
    ).toThrow(/Host field/);
    expect(() =>
      buildServerUrl({
        scheme: 'https',
        host: 'example.com:3080',
        port: '',
        path: '',
      }),
    ).toThrow(/IPv6/);
    expect(() =>
      buildServerUrl({
        scheme: 'https',
        host: 'example.com/dsh',
        port: '',
        path: '',
      }),
    ).toThrow(/Host field/);
  });

  it('normalizes IPv6 hosts without corrupting their brackets', () => {
    const url = buildServerUrl({
      scheme: 'http',
      host: 'fd7a:115c:a1e0::1',
      port: '3080',
      path: '',
    });
    expect(url).toBe('http://[fd7a:115c:a1e0::1]:3080');
    expect(splitServerUrl(url).host).toBe('fd7a:115c:a1e0::1');
  });
});
