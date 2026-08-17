import type {EditableEndpoint} from './types';

const HTTP = 'http:';
const HTTPS = 'https:';

export type EndpointSecurity =
  | {kind: 'https'; label: 'Encrypted with HTTPS'; tone: 'positive'}
  | {kind: 'local-http'; label: 'Local HTTP'; tone: 'neutral'}
  | {kind: 'private-http'; label: 'Private-network HTTP'; tone: 'warning'}
  | {kind: 'public-http'; label: 'Unencrypted remote HTTP'; tone: 'danger'};

export function normalizeServerUrl(input: string): string {
  const value = input.trim();
  if (!value) {
    throw new Error('Enter a server address.');
  }

  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let url: URL;

  try {
    url = new URL(withScheme);
  } catch {
    throw new Error('Enter a valid server address.');
  }

  if (url.protocol !== HTTP && url.protocol !== HTTPS) {
    throw new Error('Only HTTP and HTTPS servers are supported.');
  }
  if (url.username || url.password) {
    throw new Error('Credentials must not be embedded in the server URL.');
  }
  if (url.search || url.hash) {
    throw new Error('The server address cannot contain a query or fragment.');
  }
  if (!url.hostname) {
    throw new Error('Enter a server hostname or IP address.');
  }

  const normalizedPath = normalizePath(url.pathname);
  return `${url.protocol}//${url.host}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function buildServerUrl(endpoint: EditableEndpoint): string {
  const host = normalizeEditableHost(endpoint.host);

  const port = endpoint.port.trim();
  if (port) {
    const numericPort = Number(port);
    if (!/^\d+$/.test(port) || numericPort < 1 || numericPort > 65535) {
      throw new Error('Port must be a number between 1 and 65535.');
    }
  }

  const base = `${endpoint.scheme}://${host}${port ? `:${port}` : ''}`;
  const path = endpoint.path.trim();
  return normalizeServerUrl(
    `${base}${path ? `/${path.replace(/^\/+/, '')}` : ''}`,
  );
}

export function splitServerUrl(input: string): EditableEndpoint {
  const url = new URL(normalizeServerUrl(input));
  return {
    scheme: url.protocol === HTTP ? 'http' : 'https',
    host: url.hostname.replace(/^\[|\]$/g, ''),
    port: url.port,
    path:
      url.pathname === '/'
        ? ''
        : url.pathname.replace(/^\//, '').replace(/\/$/, ''),
  };
}

export function serverOrigin(input: string): string {
  return new URL(normalizeServerUrl(input)).origin;
}

export function displayEndpoint(input: string): string {
  const url = new URL(normalizeServerUrl(input));
  const suffix = url.pathname === '/' ? '' : url.pathname;
  return `${url.host}${suffix}`;
}

export function classifyEndpointSecurity(input: string): EndpointSecurity {
  const url = new URL(normalizeServerUrl(input));
  if (url.protocol === HTTPS) {
    return {kind: 'https', label: 'Encrypted with HTTPS', tone: 'positive'};
  }

  const host = stripIpv6Brackets(url.hostname.toLowerCase());
  if (isLoopbackHost(host)) {
    return {kind: 'local-http', label: 'Local HTTP', tone: 'neutral'};
  }
  if (isPrivateHost(host)) {
    return {
      kind: 'private-http',
      label: 'Private-network HTTP',
      tone: 'warning',
    };
  }
  return {
    kind: 'public-http',
    label: 'Unencrypted remote HTTP',
    tone: 'danger',
  };
}

export function isLoopbackHost(host: string): boolean {
  const normalized = stripIpv6Brackets(host.toLowerCase());
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1'
  );
}

export function isPrivateHost(host: string): boolean {
  const normalized = stripIpv6Brackets(host.toLowerCase());
  if (isLoopbackHost(normalized)) {
    return true;
  }
  if (normalized.endsWith('.local') || normalized.endsWith('.ts.net')) {
    return true;
  }
  if (
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  ) {
    return normalized.includes(':');
  }

  const parts = normalized.split('.').map(Number);
  if (
    parts.length !== 4 ||
    parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  // RFC 6598 shared address space, used by Tailscale IPv4 addresses.
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function normalizeEditableHost(input: string): string {
  const host = input.trim();
  if (!host) {
    throw new Error('Enter a server hostname or IP address.');
  }
  if (/\s/.test(host) || /[/?#@]/.test(host) || host.includes('://')) {
    throw new Error('Enter only a hostname or IP address in the Host field.');
  }

  const unwrapped = stripIpv6Brackets(host);
  if (unwrapped.includes(':')) {
    // A colon in this field is only valid for an IPv6 literal. Ports belong in
    // the dedicated Port field, which keeps parsing deterministic and safe.
    if (
      (host.startsWith('[') && !host.endsWith(']')) ||
      (!host.startsWith('[') && host.endsWith(']'))
    ) {
      throw new Error('Enter a valid IPv6 address.');
    }
    try {
      const probe = new URL(`http://[${unwrapped}]`);
      if (!probe.hostname) throw new Error();
    } catch {
      throw new Error('Enter a valid IPv6 address.');
    }
    return `[${unwrapped}]`;
  }

  if (host.startsWith('[') || host.endsWith(']')) {
    throw new Error('Enter a valid hostname or IP address.');
  }

  try {
    const probe = new URL(`http://${host}`);
    if (
      !probe.hostname ||
      probe.username ||
      probe.password ||
      probe.port ||
      probe.pathname !== '/'
    ) {
      throw new Error();
    }
    return probe.hostname;
  } catch {
    throw new Error('Enter a valid server hostname or IP address.');
  }
}

function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function stripIpv6Brackets(host: string): string {
  return host.replace(/^\[/, '').replace(/\]$/, '');
}
