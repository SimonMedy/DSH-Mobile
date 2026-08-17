export type ConnectionStatus = 'unknown' | 'checking' | 'online' | 'offline';

export interface DshServer {
  id: string;
  name: string;
  url: string;
  isDefault: boolean;
  status: ConnectionStatus;
  lastCheckedAt?: string;
  lastConnectedAt?: string;
  lastHttpStatus?: number;
}

export interface ServerDraft {
  name: string;
  url: string;
  isDefault: boolean;
}

export interface EditableEndpoint {
  scheme: 'https' | 'http';
  host: string;
  port: string;
  path: string;
}

export interface ConnectionCheckResult {
  reachable: boolean;
  checkedAt: string;
  latencyMs: number;
  httpStatus?: number;
  error?: string;
  skipped?: boolean;
}
