const {runInNewContext} = require('node:vm');
const {INJECTED_POLYFILLS} = require('../src/features/browser/webviewCrypto');

function runWithCrypto(crypto) {
  const window = {crypto};
  runInNewContext(INJECTED_POLYFILLS, {window, Uint8Array});
  return window.crypto;
}

describe('WebView crypto polyfill', () => {
  it('does not invent cryptographic randomness with Math.random', () => {
    const crypto = runWithCrypto({});
    expect(crypto.randomUUID).toBeUndefined();
    expect(INJECTED_POLYFILLS).not.toContain('Math.random');
  });

  it('preserves the native randomUUID when available', () => {
    const native = jest.fn(() => 'native-uuid');
    const crypto = runWithCrypto({randomUUID: native});
    expect(crypto.randomUUID()).toBe('native-uuid');
    expect(native).toHaveBeenCalledTimes(1);
  });

  it('uses secure bytes and produces a correctly versioned UUID', () => {
    const getRandomValues = jest.fn(bytes => {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = i;
      return bytes;
    });
    const crypto = runWithCrypto({getRandomValues});
    expect(crypto.randomUUID()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
    expect(getRandomValues).toHaveBeenCalledTimes(1);
  });
});
