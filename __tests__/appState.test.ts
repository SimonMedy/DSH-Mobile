import {appReducer, initialSnapshot} from '../src/app/state';

describe('app state invariants', () => {
  it('makes the first server default', () => {
    const state = appReducer(initialSnapshot, {
      type: 'upsert-server',
      draft: {name: 'Home', url: 'https://home.example', isDefault: false},
    });
    expect(state.servers).toHaveLength(1);
    expect(state.servers[0]?.isDefault).toBe(true);
  });

  it('keeps exactly one default server', () => {
    let state = appReducer(initialSnapshot, {
      type: 'upsert-server',
      draft: {name: 'Home', url: 'https://home.example', isDefault: false},
    });
    state = appReducer(state, {
      type: 'upsert-server',
      draft: {name: 'Work', url: 'https://work.example', isDefault: true},
    });
    expect(state.servers.filter(server => server.isDefault)).toHaveLength(1);
    expect(state.servers.find(server => server.isDefault)?.name).toBe('Work');
  });

  it('promotes another server when the default is deleted', () => {
    let state = appReducer(initialSnapshot, {
      type: 'upsert-server',
      draft: {name: 'Home', url: 'https://home.example', isDefault: false},
    });
    state = appReducer(state, {
      type: 'upsert-server',
      draft: {name: 'Work', url: 'https://work.example', isDefault: true},
    });
    const defaultId = state.servers.find(server => server.isDefault)?.id;
    expect(defaultId).toBeDefined();

    state = appReducer(state, {type: 'delete-server', serverId: defaultId!});

    expect(state.servers).toHaveLength(1);
    expect(state.servers[0]?.isDefault).toBe(true);
    expect(state.servers[0]?.name).toBe('Home');
  });

  it('moves the default flag without leaving multiple defaults', () => {
    let state = appReducer(initialSnapshot, {
      type: 'upsert-server',
      draft: {name: 'Home', url: 'https://home.example', isDefault: false},
    });
    state = appReducer(state, {
      type: 'upsert-server',
      draft: {name: 'Work', url: 'https://work.example', isDefault: false},
    });
    const workId = state.servers.find(server => server.name === 'Work')!.id;

    state = appReducer(state, {type: 'set-default', serverId: workId});

    expect(state.servers.filter(server => server.isDefault)).toHaveLength(1);
    expect(state.servers.find(server => server.isDefault)?.id).toBe(workId);
  });

  it('does not mark a server offline when a platform preflight is intentionally skipped', () => {
    const withServer = appReducer(initialSnapshot, {
      type: 'upsert-server',
      draft: {name: 'Private', url: 'http://100.64.0.1:3080', isDefault: true},
    });
    const serverId = withServer.servers[0].id;
    const checking = appReducer(withServer, {
      type: 'connection-checking',
      serverId,
    });
    const result = appReducer(checking, {
      type: 'connection-result',
      serverId,
      result: {
        reachable: false,
        skipped: true,
        checkedAt: '2026-08-17T12:00:00.000Z',
        latencyMs: 0,
      },
    });
    expect(result.servers[0].status).toBe('unknown');
  });
});
