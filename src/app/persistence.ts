import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AppSnapshot, LaunchPreference, ThemePreference} from './state';
import {enforceInvariants, initialSnapshot} from './state';
import type {DshServer} from '../features/servers/types';
import {normalizeServerUrl} from '../features/servers/serverUrl';
import {createLocalId} from '../shared/utils/id';

const APP_STATE_KEY = '@dsh-mobile/app-state/v2';
const LEGACY_SERVERS_KEY = '@dsh-mobile/servers/v1';
let writeQueue: Promise<void> = Promise.resolve();

export async function loadAppSnapshot(): Promise<AppSnapshot> {
  const raw = await AsyncStorage.getItem(APP_STATE_KEY);
  if (raw) {
    const parsed = safeParse(raw);
    if (!parsed) {
      throw new Error(
        'Stored DSH Mobile settings are invalid. Local data was left untouched.',
      );
    }
    return parsed;
  }

  const migrated = await migrateLegacyServers();
  if (migrated) {
    await persistAppSnapshot(migrated);
    await AsyncStorage.removeItem(LEGACY_SERVERS_KEY);
    return migrated;
  }
  return initialSnapshot;
}

export async function resetAppStorage(): Promise<void> {
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      await Promise.all([
        AsyncStorage.removeItem(APP_STATE_KEY),
        AsyncStorage.removeItem(LEGACY_SERVERS_KEY),
      ]);
    });
  await writeQueue;
}

export function persistAppSnapshot(snapshot: AppSnapshot): Promise<void> {
  const payload = JSON.stringify({
    ...snapshot,
    servers: snapshot.servers.map(
      ({status: _status, lastHttpStatus: _lastHttpStatus, ...server}) => server,
    ),
  });
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => AsyncStorage.setItem(APP_STATE_KEY, payload));
  return writeQueue;
}

async function migrateLegacyServers(): Promise<AppSnapshot | undefined> {
  const raw = await AsyncStorage.getItem(LEGACY_SERVERS_KEY);
  if (!raw) return undefined;

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return undefined;
    const servers = sanitizeServers(value);
    if (servers.length === 0) return undefined;
    return enforceInvariants({...initialSnapshot, servers});
  } catch {
    return undefined;
  }
}

function safeParse(raw: string): AppSnapshot | undefined {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      value.version !== 2 ||
      !Array.isArray(value.servers)
    ) {
      return undefined;
    }
    const servers = sanitizeServers(value.servers);
    const preferences = isRecord(value.preferences) ? value.preferences : {};
    const theme = sanitizeTheme(preferences.theme);
    const launch = sanitizeLaunch(preferences.launch);
    return enforceInvariants({
      version: 2,
      servers,
      preferences: {theme, launch},
    });
  } catch {
    return undefined;
  }
}

function sanitizeServers(values: unknown[]): DshServer[] {
  const seen = new Set<string>();
  return values
    .map(sanitizeServer)
    .filter(isDefined)
    .map(server => {
      let id = server.id;
      while (seen.has(id)) {
        id = createLocalId();
      }
      seen.add(id);
      return id === server.id ? server : {...server, id};
    });
}

function sanitizeServer(value: unknown): DshServer | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.name !== 'string' || typeof value.url !== 'string')
    return undefined;

  let url: string;
  try {
    url = normalizeServerUrl(value.url);
  } catch {
    return undefined;
  }

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createLocalId(),
    name: value.name.trim() || 'DSH Server',
    url,
    isDefault: value.isDefault === true,
    status: 'unknown',
    lastCheckedAt: optionalString(value.lastCheckedAt),
    lastConnectedAt: optionalString(value.lastConnectedAt),
    lastHttpStatus:
      typeof value.lastHttpStatus === 'number'
        ? value.lastHttpStatus
        : undefined,
  };
}

function sanitizeTheme(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

function sanitizeLaunch(value: unknown): LaunchPreference {
  return value === 'default' ? 'default' : 'servers';
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
