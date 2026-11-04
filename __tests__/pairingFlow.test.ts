import {
  cleanHarnessRoot,
  decidePairingLoad,
  isCleanHarnessRoot,
} from '../src/features/servers/pairingFlow';

describe('Harness pairing redirect guard', () => {
  const server = 'https://dsh.example/ui';
  const root = 'https://dsh.example/ui/';

  it('canonicalizes root and reverse-proxy mount URLs', () => {
    expect(cleanHarnessRoot('https://dsh.example')).toBe(
      'https://dsh.example/',
    );
    expect(cleanHarnessRoot(server)).toBe(root);
    expect(cleanHarnessRoot('http://127.0.0.1:3080')).toBe(
      'http://127.0.0.1:3080/',
    );
  });

  it('requires a clean, exact origin and mount path', () => {
    expect(isCleanHarnessRoot(server, root)).toBe(true);
    for (const url of [
      'https://dsh.example/ui/?token=secret',
      'https://dsh.example/ui/#fragment',
      'https://dsh.example/ui/child',
      'https://dsh.example/ui',
      'https://dsh.example/other/',
      'https://dsh.example.evil.com/ui/',
      'http://dsh.example/ui/',
      'javascript:alert(1)',
      'about:blank',
    ]) {
      expect(isCleanHarnessRoot(server, url)).toBe(false);
    }
  });

  it('requires a second clean-root load before marking the link ready', () => {
    expect(decidePairingLoad('exchange', server, `${root}?token=secret`)).toBe(
      'ignore',
    );
    expect(decidePairingLoad('exchange', server, root)).toBe('verify');
    expect(decidePairingLoad('verify', server, `${root}?token=secret`)).toBe(
      'ignore',
    );
    expect(decidePairingLoad('verify', server, root)).toBe('ready');
  });
});
