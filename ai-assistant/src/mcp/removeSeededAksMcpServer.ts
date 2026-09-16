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

import type { MCPServer, MCPSettings } from '@headlamp-k8s/ai-common/mcp/types';
import { type PluginConfig, pluginStore } from '../pluginState';

/** Server name earlier versions used for the preconfigured AKS MCP server. */
const AKS_MCP_SERVER_NAME = 'aks-mcp';

const EMPTY_MCP_CONFIG: MCPSettings = { enabled: false, servers: [] };

/** The parts of a built-in server the plugin owned, as last written by it. */
export interface SeededServerDefinition {
  /** Executable used to start the server. */
  command: string;
  /** Arguments passed to the server command. */
  args: string[];
  /** Environment variables added to the server process. */
  env?: Record<string, string>;
}

/**
 * Reconciliation state written by versions that seeded built-in MCP servers.
 *
 * Keys are server names, trimmed and lowercased. A `null` value comes from a
 * version that recorded only ownership, not the definition it wrote. Installs
 * seeded before that persisted a plain list of server names instead.
 */
export type PersistedBuiltinServerState =
  | Record<string, SeededServerDefinition | null>
  | readonly string[];

/** @returns The comparison key for a server name. */
function toKey(name: string): string {
  return name.trim().toLowerCase();
}

/** @returns Whether two environments hold the same variables, whatever their key order. */
function isSameEnv(a: Record<string, string> = {}, b: Record<string, string> = {}): boolean {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  return (
    aKeys.length === bKeys.length && aKeys.every((key, i) => key === bKeys[i] && a[key] === b[key])
  );
}

/** @returns Whether two definitions describe the same server process. */
function isSameDefinition(a: SeededServerDefinition, b: SeededServerDefinition): boolean {
  return (
    a.command === b.command &&
    a.args.length === b.args.length &&
    a.args.every((arg, i) => arg === b.args[i]) &&
    isSameEnv(a.env, b.env)
  );
}

/** @returns The plugin-owned parts of a server definition. */
function toDefinition({ command, args, env }: MCPServer): SeededServerDefinition {
  return { command, args: args ?? [], env };
}

/**
 * Reads what the plugin last wrote for `aks-mcp`.
 *
 * @param state - Reconciliation state as persisted by an earlier version.
 * @returns The recorded definition, `null` when the plugin owned the entry but
 *          did not record what it wrote, or `undefined` when it never seeded one.
 */
function getSeededDefinition(
  state: PersistedBuiltinServerState | undefined
): SeededServerDefinition | null | undefined {
  if (!state) return undefined;
  if (Array.isArray(state)) {
    return state.some(name => toKey(String(name)) === AKS_MCP_SERVER_NAME) ? null : undefined;
  }
  const entry = Object.entries(state as Record<string, SeededServerDefinition | null>).find(
    ([name]) => toKey(name) === AKS_MCP_SERVER_NAME
  );
  return entry ? entry[1] : undefined;
}

/**
 * Drops the plugin-seeded `aks-mcp` servers from a configuration.
 *
 * Every entry under the name is considered, since duplicates can exist. An
 * entry the user has edited is theirs, so it is kept. A `null` definition means
 * an older seeding version claimed the entry without recording it; it would
 * have overwritten the entry, so it is removed.
 *
 * @param config - Configuration to filter.
 * @param lastWritten - Definition the plugin last wrote, if it recorded one.
 * @returns The configuration without the seeded servers, or the original one.
 */
function withoutSeededAksMcp(
  config: MCPSettings,
  lastWritten: SeededServerDefinition | null
): MCPSettings {
  const servers = Array.isArray(config.servers) ? config.servers : [];
  const remaining = servers.filter(server => {
    if (!server || toKey(server.name) !== AKS_MCP_SERVER_NAME) return true;
    return lastWritten !== null && !isSameDefinition(toDefinition(server), lastWritten);
  });
  if (remaining.length === servers.length) return config;
  return { ...config, servers: remaining };
}

/**
 * Rewrites the stored configuration without the obsolete reconciliation state.
 *
 * `update` merges, so it cannot drop a key; the whole configuration is set.
 *
 * @param stored - Configuration as currently persisted.
 * @param mcpConfig - Fallback MCP configuration to store, when it changed.
 */
function clearSeededState(stored: PluginConfig, mcpConfig?: MCPSettings): void {
  const next: PluginConfig = { ...stored };
  delete next.seededBuiltinMCPServers;
  if (mcpConfig) next.mcpConfig = mcpConfig;
  pluginStore.set(next);
}

/**
 * Removes the `aks-mcp` servers earlier versions preconfigured on AKS Desktop.
 *
 * Seeding has been dropped, but an upgraded install still runs the server that
 * was written to the desktop MCP configuration. This one-time migration removes
 * those entries when they still match what the plugin wrote, leaves customized
 * and user-created entries alone, and then clears the reconciliation state so it
 * does not run again. Only a successful write clears the state, so a host that
 * cannot be reached yet is retried on the next launch.
 *
 * @returns Resolves once the migration has been attempted.
 */
export async function removeSeededAksMcpServer(): Promise<void> {
  try {
    const stored = pluginStore.get();
    if (!stored || !Object.prototype.hasOwnProperty.call(stored, 'seededBuiltinMCPServers')) {
      return;
    }

    const lastWritten = getSeededDefinition(stored.seededBuiltinMCPServers);
    if (lastWritten === undefined) {
      clearSeededState(stored);
      return;
    }

    const mcpApi = typeof window === 'undefined' ? undefined : window.desktopApi?.mcp;
    if (!mcpApi) {
      console.warn('Desktop MCP bridge unavailable; deferring removal of the aks-mcp server.');
      return;
    }

    const response = await mcpApi.getConfig();
    // Writing back a fallback config would drop servers the read failed to return.
    if (!response?.success || !Array.isArray(response.config?.servers)) {
      console.error('Failed to read MCP configuration before removing aks-mcp:', response?.error);
      return;
    }

    const currentConfig = { ...EMPTY_MCP_CONFIG, ...response.config } as MCPSettings;
    const nextConfig = withoutSeededAksMcp(currentConfig, lastWritten);
    if (nextConfig !== currentConfig) {
      const updateResponse = await mcpApi.updateConfig(nextConfig);
      if (!updateResponse?.success) {
        console.error('Failed to remove the preconfigured aks-mcp server:', updateResponse?.error);
        return;
      }
    }

    clearSeededState(stored, nextConfig);
  } catch (error) {
    console.error('Error removing the preconfigured aks-mcp server:', error);
  }
}
