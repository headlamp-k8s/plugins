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

import type { MCPServer, MCPSettings } from '../types';

/** Server name used for the Azure Kubernetes Service MCP server. */
export const AKS_MCP_SERVER_NAME = 'aks-mcp';

/**
 * Components enabled for the preconfigured `aks-mcp` server.
 *
 * `aks-mcp` enables every component by default and refuses to start when any
 * enabled component's CLI is missing from `PATH`. These components need only
 * the bundled Azure CLI. The `kubectl`, `helm`, `cilium`, and `hubble`
 * components each require their own binary, so they are opt-in: add them to the
 * server arguments in MCP settings once the CLI is installed.
 */
const AKS_MCP_COMPONENTS = [
  'az_cli',
  'monitor',
  'fleet',
  'network',
  'compute',
  'detectors',
  'advisor',
  'inspektorgadget',
].join(',');

/**
 * Builds the preconfigured `aks-mcp` server definition.
 *
 * The command is left unqualified so it resolves from `PATH`; hosts that ship
 * the binary (AKS Desktop) prepend their bundled tools directory to `PATH`.
 *
 * @returns The default `aks-mcp` stdio server definition.
 */
export function createAksMcpServer(): MCPServer {
  return {
    name: AKS_MCP_SERVER_NAME,
    command: 'aks-mcp',
    args: [
      '--transport',
      'stdio',
      '--access-level',
      'readonly',
      '--enabled-components',
      AKS_MCP_COMPONENTS,
    ],
    enabled: true,
  };
}

/** The parts of a built-in server the plugin owns, as last written by it. */
export interface BuiltinServerDefinition {
  /** Executable used to start the server. */
  command: string;
  /** Arguments passed to the server command. */
  args: string[];
  /** Environment variables added to the server process. */
  env?: Record<string, string>;
}

/**
 * Records the definition last written for each built-in server, keyed by its
 * name trimmed and lowercased.
 *
 * A `null` value means the server was seeded by an older version that did not
 * record its definition, so customization cannot be detected.
 */
export type BuiltinServerState = Record<string, BuiltinServerDefinition | null>;

/**
 * Reconciliation state as it may exist on disk.
 *
 * Installs seeded before definitions were recorded persisted a plain list of
 * server names; {@link reconcileBuiltinServers} upgrades those on the next run.
 */
export type PersistedBuiltinServerState = BuiltinServerState | readonly string[];

/** Outcome of reconciling built-in server definitions with stored config. */
export interface ReconcileBuiltinServersResult {
  /** Configuration including any added or refreshed built-in servers. */
  config: MCPSettings;
  /** Definitions to persist for the next reconciliation. */
  state: BuiltinServerState;
  /** Whether the configuration changed and needs writing back to the host. */
  changed: boolean;
  /** Whether the recorded definitions changed, which can happen without a config change. */
  stateChanged: boolean;
}

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
function isSameDefinition(a: BuiltinServerDefinition, b: BuiltinServerDefinition): boolean {
  return (
    a.command === b.command &&
    a.args.length === b.args.length &&
    a.args.every((arg, i) => arg === b.args[i]) &&
    isSameEnv(a.env, b.env)
  );
}

/** @returns The plugin-owned parts of a server definition. */
function toDefinition({ command, args, env }: MCPServer): BuiltinServerDefinition {
  return env === undefined ? { command, args } : { command, args, env };
}

/** @returns The server with plugin-owned fields replaced, dropping an env the built-in no longer sets. */
function applyDefinition(existing: MCPServer, definition: BuiltinServerDefinition): MCPServer {
  const refreshed: MCPServer = { ...existing, command: definition.command, args: definition.args };
  if (definition.env === undefined) {
    delete refreshed.env;
  } else {
    refreshed.env = definition.env;
  }
  return refreshed;
}

/** @returns Previously seeded state, upgrading the legacy name-list format. */
function normalizeState(previous: PersistedBuiltinServerState): BuiltinServerState {
  const entries = Array.isArray(previous)
    ? previous.map(name => [toKey(name), null] as const)
    : Object.entries(previous).map(([name, definition]) => [toKey(name), definition] as const);
  return Object.fromEntries(entries);
}

/**
 * Applies host-provided built-in MCP servers to a stored configuration.
 *
 * A built-in is added once. On later runs its command and arguments are
 * refreshed so improvements reach existing installs, but only while the user
 * has not edited them; a customized or deleted server is left untouched. The
 * `enabled` and `autoApprove` toggles always belong to the user.
 *
 * @param config - Currently persisted MCP configuration.
 * @param builtinServers - Server definitions the host wants preconfigured.
 * @param previousState - Definitions written by the previous reconciliation.
 * @returns The reconciled config, the state to persist, and whether it changed.
 */
export function reconcileBuiltinServers(
  config: MCPSettings,
  builtinServers: MCPServer[],
  previousState: PersistedBuiltinServerState = {}
): ReconcileBuiltinServersResult {
  const state = normalizeState(previousState);
  const nextState: BuiltinServerState = { ...state };
  const servers = [...config.servers];
  let enabled = config.enabled;
  let changed = false;
  let stateChanged = false;

  for (const builtin of builtinServers) {
    const key = toKey(builtin.name);
    const index = servers.findIndex(server => toKey(server.name) === key);
    const wasSeeded = key in state;

    if (!wasSeeded) {
      // A server the user created under this name is theirs, not ours to adopt.
      if (index !== -1) continue;
      servers.push(builtin);
      nextState[key] = toDefinition(builtin);
      enabled = true;
      changed = true;
      stateChanged = true;
      continue;
    }

    // Seeded before but no longer present: the user deleted it, so keep it gone.
    if (index === -1) continue;

    const existing = servers[index];
    const lastWritten = state[key];
    if (lastWritten !== null && !isSameDefinition(toDefinition(existing), lastWritten)) {
      continue;
    }

    const definition = toDefinition(builtin);
    if (lastWritten === null || !isSameDefinition(lastWritten, definition)) {
      nextState[key] = definition;
      stateChanged = true;
    }
    if (isSameDefinition(toDefinition(existing), definition)) continue;

    servers[index] = applyDefinition(existing, definition);
    changed = true;
  }

  return changed
    ? { config: { enabled, servers }, state: nextState, changed, stateChanged }
    : { config, state: nextState, changed, stateChanged };
}
