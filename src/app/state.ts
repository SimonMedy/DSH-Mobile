import type {
  ConnectionCheckResult,
  DshServer,
  ServerDraft,
} from '../features/servers/types';
import {createLocalId} from '../shared/utils/id';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LaunchPreference = 'servers' | 'default';

export interface AppPreferences {
  theme: ThemePreference;
  launch: LaunchPreference;
}

export interface AppSnapshot {
  version: 2;
  servers: DshServer[];
  preferences: AppPreferences;
}

export const initialSnapshot: AppSnapshot = {
  version: 2,
  servers: [],
  preferences: {theme: 'system', launch: 'servers'},
};

export type AppAction =
  | {type: 'hydrate'; snapshot: AppSnapshot}
  | {type: 'upsert-server'; serverId?: string; draft: ServerDraft}
  | {type: 'delete-server'; serverId: string}
  | {type: 'set-default'; serverId: string}
  | {type: 'connection-checking'; serverId: string}
  | {type: 'connection-result'; serverId: string; result: ConnectionCheckResult}
  | {type: 'set-theme'; theme: ThemePreference}
  | {type: 'set-launch'; launch: LaunchPreference};

export function appReducer(state: AppSnapshot, action: AppAction): AppSnapshot {
  switch (action.type) {
    case 'hydrate':
      return enforceInvariants(action.snapshot);
    case 'upsert-server': {
      const existing = action.serverId
        ? state.servers.find(server => server.id === action.serverId)
        : undefined;
      const makeDefault = action.draft.isDefault || state.servers.length === 0;
      let servers = makeDefault
        ? state.servers.map(server => ({...server, isDefault: false}))
        : [...state.servers];

      if (existing) {
        servers = servers.map(server =>
          server.id === existing.id
            ? {...server, ...action.draft, isDefault: makeDefault}
            : server,
        );
      } else {
        servers.push({
          id: createLocalId(),
          ...action.draft,
          isDefault: makeDefault,
          status: 'unknown',
        });
      }
      return enforceInvariants({...state, servers});
    }
    case 'delete-server':
      return enforceInvariants({
        ...state,
        servers: state.servers.filter(server => server.id !== action.serverId),
      });
    case 'set-default':
      return enforceInvariants({
        ...state,
        servers: state.servers.map(server => ({
          ...server,
          isDefault: server.id === action.serverId,
        })),
      });
    case 'connection-checking':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.serverId
            ? {...server, status: 'checking'}
            : server,
        ),
      };
    case 'connection-result':
      return {
        ...state,
        servers: state.servers.map(server => {
          if (server.id !== action.serverId) return server;
          if (action.result.skipped) {
            return {
              ...server,
              status: server.status === 'checking' ? 'unknown' : server.status,
              lastCheckedAt: action.result.checkedAt,
            };
          }
          const reachable = action.result.reachable;
          return {
            ...server,
            status: reachable ? 'online' : 'offline',
            lastCheckedAt: action.result.checkedAt,
            lastConnectedAt: reachable
              ? action.result.checkedAt
              : server.lastConnectedAt,
            lastHttpStatus: action.result.httpStatus,
          };
        }),
      };
    case 'set-theme':
      return {
        ...state,
        preferences: {...state.preferences, theme: action.theme},
      };
    case 'set-launch':
      return {
        ...state,
        preferences: {...state.preferences, launch: action.launch},
      };
    default:
      return state;
  }
}

export function enforceInvariants(snapshot: AppSnapshot): AppSnapshot {
  if (snapshot.servers.length === 0) {
    return {...snapshot, servers: []};
  }

  const defaultIndex = snapshot.servers.findIndex(server => server.isDefault);
  const chosenDefault = defaultIndex >= 0 ? defaultIndex : 0;
  let seenDefault = false;
  const servers = snapshot.servers.map((server, index) => {
    const isDefault = index === chosenDefault && !seenDefault;
    if (isDefault) seenDefault = true;
    return server.isDefault === isDefault ? server : {...server, isDefault};
  });

  // Ensure default server is always at the top of the list
  servers.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

  return {...snapshot, servers};
}
