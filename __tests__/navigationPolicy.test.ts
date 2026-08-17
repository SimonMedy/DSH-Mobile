import {
  decideNavigation,
  decidePopupNavigation,
} from '../src/features/browser/navigationPolicy';

describe('WebView navigation policy', () => {
  const server = 'https://dsh.example.com/base';

  it('keeps the configured origin inside the WebView', () => {
    expect(decideNavigation(server, 'https://dsh.example.com/session/1')).toBe(
      'allow',
    );
  });

  it('opens other HTTP origins externally', () => {
    expect(
      decideNavigation(
        server,
        'https://github.com/deepseek-ai/deepseek-harness',
      ),
    ).toBe('external');
  });

  it('allows only same-origin blob URLs', () => {
    expect(decideNavigation(server, 'blob:https://dsh.example.com/1a2b')).toBe(
      'allow',
    );
    expect(decideNavigation(server, 'blob:https://evil.example/1a2b')).toBe(
      'block',
    );
  });

  it('ignores empty popup placeholders instead of replacing the active DSH page', () => {
    expect(decidePopupNavigation(server, 'about:blank')).toBe('ignore');
    expect(decidePopupNavigation(server, '')).toBe('ignore');
    expect(
      decidePopupNavigation(server, 'https://dsh.example.com/session/2'),
    ).toBe('allow');
    expect(decidePopupNavigation(server, 'https://github.com')).toBe(
      'external',
    );
  });

  it('blocks dangerous URL schemes', () => {
    expect(decideNavigation(server, 'javascript:alert(1)')).toBe('block');
    expect(decideNavigation(server, 'file:///etc/passwd')).toBe('block');
    expect(decideNavigation(server, 'data:text/html,hello')).toBe('block');
    expect(decideNavigation(server, 'intent://example')).toBe('block');
    expect(decideNavigation(server, 'dshmobile://server')).toBe('block');
  });
});
