// This script runs in the untrusted WebView page, before its own JavaScript.
// Never claim cryptographic randomness when the platform does not provide it.
export const INJECTED_POLYFILLS = `
(function() {
  try {
    if (typeof window === 'undefined' || !window.crypto) return;
    if (typeof window.crypto.randomUUID === 'function') return;
    if (typeof window.crypto.getRandomValues !== 'function') return;
    window.crypto.randomUUID = function() {
      var bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      var hex = Array.prototype.map.call(bytes, function(value) {
        return value.toString(16).padStart(2, '0');
      }).join('');
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' +
        hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    };
  } catch (error) {
    // A locked-down crypto object must remain unavailable, not become weak.
  }
})();
true;
`;
