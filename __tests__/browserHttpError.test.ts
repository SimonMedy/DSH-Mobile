import {browserDocumentError} from '../src/features/browser/browserHttpError';

describe('WebView top-level HTTP failures', () => {
  const server = 'https://dsh.example/ui';
  const root = 'https://dsh.example/ui/';

  it('explains authentication and trust failures without echoing URLs or credentials', () => {
    expect(browserDocumentError(server, root, 401)).toContain('not authorized');
    expect(browserDocumentError(server, root, 403)).toContain('trusted-host');
    expect(browserDocumentError(server, root, 431)).toContain(
      'request headers',
    );
    expect(browserDocumentError(server, root, 503)).toContain('HTTP 503');
    expect(browserDocumentError(server, root, 200)).toBeUndefined();
  });

  it('ignores subresource, token-bearing and cross-origin failures', () => {
    for (const url of [
      'https://dsh.example/ui/api/models',
      'https://dsh.example/ui/?token=sensitive',
      'https://dsh.example/ui/#secret',
      'https://evil.example/ui/',
      'https://dsh.example.evil.test/ui/',
      'http://dsh.example/ui/',
      'about:blank',
    ]) {
      expect(browserDocumentError(server, url, 401)).toBeUndefined();
    }
  });

  it('recognizes the server root without a path prefix', () => {
    expect(
      browserDocumentError('https://dsh.example', 'https://dsh.example/', 401),
    ).toContain('not authorized');
  });
});
