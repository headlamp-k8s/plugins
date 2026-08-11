/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it } from 'vitest';
import type { MCPSettings } from '../types';
import { AKS_MCP_SERVER_NAME, createAksMcpServer, reconcileBuiltinServers } from './builtinServers';

const EMPTY: MCPSettings = { enabled: false, servers: [] };

/** @returns Config holding one aks-mcp server with the supplied arguments. */
function configWithArgs(args: string[], overrides = {}): MCPSettings {
  return {
    enabled: true,
    servers: [{ name: AKS_MCP_SERVER_NAME, command: 'aks-mcp', args, enabled: true, ...overrides }],
  };
}

describe('createAksMcpServer', () => {
  it('enables only components that need no extra CLI binary', () => {
    const args = createAksMcpServer().args;
    const components = args[args.indexOf('--enabled-components') + 1].split(',');

    expect(components).toContain('az_cli');
    expect(components).toContain('inspektorgadget');
    expect(components).not.toContain('cilium');
    expect(components).not.toContain('hubble');
    expect(components).not.toContain('kubectl');
    expect(components).not.toContain('helm');
  });
});

describe('reconcileBuiltinServers', () => {
  it('adds a built-in server and enables MCP', () => {
    const result = reconcileBuiltinServers(EMPTY, [createAksMcpServer()]);

    expect(result.changed).toBe(true);
    expect(result.config.enabled).toBe(true);
    expect(result.config.servers).toHaveLength(1);
    expect(result.state[AKS_MCP_SERVER_NAME]).toEqual({
      command: 'aks-mcp',
      args: createAksMcpServer().args,
    });
  });

  it('makes no changes when the built-in is already up to date', () => {
    const seeded = reconcileBuiltinServers(EMPTY, [createAksMcpServer()]);

    const again = reconcileBuiltinServers(seeded.config, [createAksMcpServer()], seeded.state);

    expect(again.changed).toBe(false);
    expect(again.config).toBe(seeded.config);
  });

  it('refreshes arguments when the built-in definition changes', () => {
    const stale = configWithArgs(['--transport', 'stdio']);
    const state = { [AKS_MCP_SERVER_NAME]: { command: 'aks-mcp', args: ['--transport', 'stdio'] } };

    const result = reconcileBuiltinServers(stale, [createAksMcpServer()], state);

    expect(result.changed).toBe(true);
    expect(result.config.servers[0].args).toEqual(createAksMcpServer().args);
  });

  it('preserves the user enabled and autoApprove toggles when refreshing', () => {
    const stale = configWithArgs(['--transport', 'stdio'], { enabled: false, autoApprove: true });
    const state = { [AKS_MCP_SERVER_NAME]: { command: 'aks-mcp', args: ['--transport', 'stdio'] } };

    const result = reconcileBuiltinServers(stale, [createAksMcpServer()], state);

    expect(result.config.servers[0].enabled).toBe(false);
    expect(result.config.servers[0].autoApprove).toBe(true);
  });

  it('does not overwrite arguments the user edited', () => {
    const customized = configWithArgs(['--transport', 'stdio', '--access-level', 'admin']);
    const state = { [AKS_MCP_SERVER_NAME]: { command: 'aks-mcp', args: ['--transport', 'stdio'] } };

    const result = reconcileBuiltinServers(customized, [createAksMcpServer()], state);

    expect(result.changed).toBe(false);
    expect(result.config.servers[0].args).toEqual([
      '--transport',
      'stdio',
      '--access-level',
      'admin',
    ]);
  });

  it('does not reseed a server the user removed', () => {
    const state = { [AKS_MCP_SERVER_NAME]: { command: 'aks-mcp', args: [] } };

    const result = reconcileBuiltinServers(EMPTY, [createAksMcpServer()], state);

    expect(result.changed).toBe(false);
    expect(result.config.servers).toEqual([]);
  });

  it('does not adopt a same-named server the user created', () => {
    const custom = configWithArgs([], { command: '/custom/aks-mcp' });

    const result = reconcileBuiltinServers(custom, [createAksMcpServer()]);

    expect(result.changed).toBe(false);
    expect(result.config.servers[0].command).toBe('/custom/aks-mcp');
  });

  it('upgrades servers seeded before definitions were recorded', () => {
    const stale = configWithArgs(['--transport', 'stdio']);

    const result = reconcileBuiltinServers(stale, [createAksMcpServer()], [AKS_MCP_SERVER_NAME]);

    expect(result.changed).toBe(true);
    expect(result.config.servers[0].args).toEqual(createAksMcpServer().args);
  });

  it('preserves unrelated servers', () => {
    const existing: MCPSettings = {
      enabled: true,
      servers: [{ name: 'flux-mcp', command: 'flux-operator-mcp', args: ['serve'], enabled: true }],
    };

    const result = reconcileBuiltinServers(existing, [createAksMcpServer()]);

    expect(result.config.servers.map(server => server.name)).toEqual([
      'flux-mcp',
      AKS_MCP_SERVER_NAME,
    ]);
  });
});
