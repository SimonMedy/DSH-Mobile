import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type {PropsWithChildren} from 'react';
import {
  canPreflightConnection,
  checkServerConnection,
} from '../features/servers/connection';
import type {
  ConnectionCheckResult,
  DshServer,
  ServerDraft,
} from '../features/servers/types';
import {appReducer, initialSnapshot} from './state';
import type {AppSnapshot, LaunchPreference, ThemePreference} from './state';
import {
  loadAppSnapshot,
  persistAppSnapshot,
  resetAppStorage,
} from './persistence';

interface AppStateContextValue {
  snapshot: AppSnapshot;
  hydrated: boolean;
  hydrationError?: string;
  servers: DshServer[];
  upsertServer: (draft: ServerDraft, serverId?: string) => void;
  deleteServer: (serverId: string) => void;
  setDefaultServer: (serverId: string) => void;
  setTheme: (theme: ThemePreference) => void;
  setLaunch: (launch: LaunchPreference) => void;
  testConnection: (serverId: string) => Promise<ConnectionCheckResult>;
  markConnected: (serverId: string, httpStatus?: number) => void;
  markOffline: (serverId: string) => void;
  resetLocalData: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);

export function AppStateProvider({children}: PropsWithChildren) {
  const [snapshot, dispatch] = useReducer(appReducer, initialSnapshot);
  const [hydrated, setHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<string>();

  useEffect(() => {
    let active = true;
    loadAppSnapshot()
      .then(loaded => {
        if (active) dispatch({type: 'hydrate', snapshot: loaded});
      })
      .catch(error => {
        if (active) {
          setHydrationError(
            error instanceof Error
              ? error.message
              : 'Could not load local settings.',
          );
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || hydrationError) return;
    persistAppSnapshot(snapshot).catch(error => {
      console.error('Failed to persist DSH Mobile state', error);
    });
  }, [hydrated, hydrationError, snapshot]);

  const testConnection = useCallback(
    async (serverId: string) => {
      const server = snapshot.servers.find(item => item.id === serverId);
      if (!server) {
        return {
          reachable: false,
          checkedAt: new Date().toISOString(),
          latencyMs: 0,
          error: 'Server not found.',
        };
      }
      if (canPreflightConnection(server.url)) {
        dispatch({type: 'connection-checking', serverId});
      }
      const result = await checkServerConnection(server.url);
      dispatch({type: 'connection-result', serverId, result});
      return result;
    },
    [snapshot.servers],
  );

  const resetLocalData = useCallback(async () => {
    await resetAppStorage();
    dispatch({type: 'hydrate', snapshot: initialSnapshot});
    setHydrationError(undefined);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      snapshot,
      hydrated,
      hydrationError,
      servers: snapshot.servers,
      upsertServer: (draft, serverId) =>
        dispatch({type: 'upsert-server', draft, serverId}),
      deleteServer: serverId => dispatch({type: 'delete-server', serverId}),
      setDefaultServer: serverId => dispatch({type: 'set-default', serverId}),
      setTheme: theme => dispatch({type: 'set-theme', theme}),
      setLaunch: launch => dispatch({type: 'set-launch', launch}),
      testConnection,
      markConnected: (serverId, httpStatus) =>
        dispatch({
          type: 'connection-result',
          serverId,
          result: {
            reachable: true,
            checkedAt: new Date().toISOString(),
            latencyMs: 0,
            httpStatus,
          },
        }),
      markOffline: serverId =>
        dispatch({
          type: 'connection-result',
          serverId,
          result: {
            reachable: false,
            checkedAt: new Date().toISOString(),
            latencyMs: 0,
            error: 'WebView navigation failed.',
          },
        }),
      resetLocalData,
    }),
    [snapshot, hydrated, hydrationError, testConnection, resetLocalData],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value)
    throw new Error('useAppState must be used inside AppStateProvider.');
  return value;
}
