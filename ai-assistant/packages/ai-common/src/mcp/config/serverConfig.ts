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

import type { MCPSettings, MCPToolState } from '../types';

/** Runtime MCP server configuration consumed by MultiServerMCPClient. */
type MCPServerConfig = {
  /** Process transport used to communicate with the server. */
  transport: 'stdio';
  /** Executable used to start the MCP server. */
  command: string;
  /** Expanded command-line arguments passed to the server. */
  args: string[];
  /** Fully merged process environment for the server. */
  env: Record<string, string>;
  /** Automatic process restart policy. */
  restart: {
    /** Whether the MCP client should restart a stopped server. */
    enabled: boolean;
    /** Maximum number of restart attempts. */
    maxAttempts: number;
    /** Delay between restart attempts in milliseconds. */
    delayMs: number;
  };
};

/**
 * Expand environment variables and resolve paths in arguments.
 *
 * @param args - The array of argument strings to expand.
 * @param cluster - The specific cluster name to replace HEADLAMP_CURRENT_CLUSTER, if provided.
 * @param platform - Optional platform override used for Windows path conversion.
 *
 * @returns The array of expanded argument strings.
 */
export function expandEnvAndResolvePaths(
  args: string[],
  cluster: string | null = null,
  platform?: string
): string[] {
  // Resolve the effective platform inside the function body so that the default
  // parameter never references `process` directly — referencing it during
  // parameter evaluation can throw in non-Node runtimes (browser / some
  // Electron renderer builds) where `process` may be undefined.
  const effectivePlatform =
    platform ?? (typeof process !== 'undefined' ? process.platform : 'linux');
  // Guard against `process` being polyfilled without a usable `env` object.
  const env: Record<string, string | undefined> =
    typeof process !== 'undefined' ? process.env ?? {} : {};
  return args.map(arg => {
    // Replace Windows environment variables like %USERPROFILE%
    let expandedArg = arg;

    // Handle HEADLAMP_CURRENT_CLUSTER placeholder
    if (expandedArg.includes('HEADLAMP_CURRENT_CLUSTER')) {
      expandedArg = expandedArg.replace(/HEADLAMP_CURRENT_CLUSTER/g, cluster || '');
    }

    // Handle %USERPROFILE%
    if (expandedArg.includes('%USERPROFILE%')) {
      const userProfile = env.USERPROFILE || env.HOME || '';
      expandedArg = expandedArg.replace(/%USERPROFILE%/g, userProfile);
    }

    // Handle other common Windows environment variables
    if (expandedArg.includes('%APPDATA%')) {
      const appdata = env.APPDATA || '';
      expandedArg = expandedArg.replace(/%APPDATA%/g, appdata);
    }

    if (expandedArg.includes('%LOCALAPPDATA%')) {
      const localappdata = env.LOCALAPPDATA || '';
      expandedArg = expandedArg.replace(/%LOCALAPPDATA%/g, localappdata);
    }

    // Convert Windows backslashes to forward slashes for Docker
    if (effectivePlatform === 'win32' && expandedArg.includes('\\')) {
      expandedArg = expandedArg.replace(/\\/g, '/');
    }

    // Handle Docker volume mount format and ensure proper Windows path format
    if (expandedArg.includes('type=bind,src=')) {
      const match = expandedArg.match(/type=bind,src=(.+?),dst=(.+)/);
      if (match) {
        let srcPath = match[1];
        const dstPath = match[2];

        // Resolve the source path — Node only; in browser this branch is unreachable
        // because effectivePlatform will never be 'win32' in a browser context.
        if (effectivePlatform === 'win32') {
          // Resolve relative paths to absolute using process.cwd() (Node-only)
          if (typeof process !== 'undefined' && !srcPath.match(/^[A-Za-z]:[\\/]|^\//)) {
            srcPath = process.cwd() + '\\' + srcPath;
          }
          // For Docker on Windows, we might need to convert C:\ to /c/ format
          if (srcPath.match(/^[A-Za-z]:/)) {
            srcPath = '/' + srcPath.charAt(0).toLowerCase() + srcPath.slice(2).replace(/\\/g, '/');
          }
        }

        expandedArg = `type=bind,src=${srcPath},dst=${dstPath}`;
      }
    }

    return expandedArg;
  });
}

/**
 * Build MCP server configuration from MCPSettings for MultiServerMCPClient.
 *
 * @param mcpSettings - The MCP settings to build from, or null if none.
 * @param clusters - List of current clusters (first is used for HEADLAMP_CURRENT_CLUSTER).
 *
 * @returns Record of MCP servers suitable for MultiServerMCPClient's mcpServers config.
 */
export function makeMcpServers(
  mcpSettings: MCPSettings | null,
  clusters: string[]
): Record<string, MCPServerConfig> {
  const mcpServers: Record<string, MCPServerConfig> = {};

  if (
    !mcpSettings ||
    !mcpSettings.enabled ||
    !mcpSettings.servers ||
    mcpSettings.servers.length === 0
  ) {
    return mcpServers;
  }

  for (const server of mcpSettings.servers) {
    if (!server.enabled || !server.name || !server.command) {
      continue;
    }

    const expandedArgs = expandEnvAndResolvePaths(server.args || [], clusters[0] || null);

    // Merge process.env with server-specific overrides, then filter out any
    // undefined values so the result is a genuine Record<string, string>.
    // Guard against environments where `process` may be undefined (browser runtimes).
    const nodeEnv: Record<string, string | undefined> =
      typeof process !== 'undefined' ? process.env ?? {} : {};
    const mergedEnv = server.env ? { ...nodeEnv, ...server.env } : { ...nodeEnv };
    const serverEnv: Record<string, string> = Object.fromEntries(
      Object.entries(mergedEnv).filter((entry): entry is [string, string] => entry[1] !== undefined)
    );

    mcpServers[server.name] = {
      transport: 'stdio',
      command: server.command,
      args: expandedArgs,
      env: serverEnv,
      restart: {
        enabled: true,
        maxAttempts: 3,
        delayMs: 2000,
      },
    };
  }

  return mcpServers;
}

/**
 * Check if any server in the settings uses HEADLAMP_CURRENT_CLUSTER placeholder.
 * This determines whether the MCP client needs to be restarted on cluster changes.
 *
 * @param mcpSettings - The MCP settings to check, or null if none.
 *
 * @returns True if any enabled server has HEADLAMP_CURRENT_CLUSTER in its arguments.
 */
export function hasClusterDependentServers(mcpSettings: MCPSettings | null): boolean {
  return (
    mcpSettings?.servers.some(
      server =>
        server.enabled &&
        server.args &&
        server.args.some(arg => arg.includes('HEADLAMP_CURRENT_CLUSTER'))
    ) || false
  );
}

/**
 * settingsChanges returns a list of human-readable descriptions of changes
 * between the current MCP settings and next MCP settings.
 *
 * @param currentSettings - The current MCP settings, or null if none exist.
 * @param nextSettings - The next MCP settings to compare against.
 *
 * @returns An array of strings describing the changes.
 */
export function settingsChanges(
  currentSettings: MCPSettings | null,
  nextSettings: MCPSettings | null
): string[] {
  const changes: string[] = [];

  const currentEnabled = currentSettings?.enabled ?? false;
  const nextEnabled = nextSettings?.enabled ?? false;

  if (currentEnabled !== nextEnabled) {
    changes.push(`• MCP will be ${nextEnabled ? 'ENABLED' : 'DISABLED'}`);
  }

  const currentServers = currentSettings?.servers ?? [];
  const nextServers = nextSettings?.servers ?? [];

  const currentServerNames = new Set(currentServers.map(s => s.name));
  const nextServerNames = new Set(nextServers.map(s => s.name));

  for (const server of nextServers) {
    if (!currentServerNames.has(server.name)) {
      changes.push(`• ADD server: "${server.name}" (${server.command})`);
    }
  }

  for (const server of currentServers) {
    if (!nextServerNames.has(server.name)) {
      changes.push(`• REMOVE server: "${server.name}"`);
    }
  }

  for (const nextServer of nextServers) {
    const currentServer = currentServers.find(s => s.name === nextServer.name);
    if (currentServer) {
      const serverChanges: string[] = [];

      if (currentServer.enabled !== nextServer.enabled) {
        serverChanges.push(`${nextServer.enabled ? 'enable' : 'disable'}`);
      }

      if (currentServer.command !== nextServer.command) {
        serverChanges.push(`change command: "${currentServer.command}" → "${nextServer.command}"`);
      }

      const currentArgs = JSON.stringify(currentServer.args || []);
      const nextArgs = JSON.stringify(nextServer.args || []);
      if (currentArgs !== nextArgs) {
        serverChanges.push(`change arguments: ${currentArgs} → ${nextArgs}`);
      }

      const currentEnv = JSON.stringify(currentServer.env || {});
      const nextEnv = JSON.stringify(nextServer.env || {});
      if (currentEnv !== nextEnv) {
        serverChanges.push('change environment variables');
      }

      if (serverChanges.length > 0) {
        changes.push(`• MODIFY server "${nextServer.name}": ${serverChanges.join(', ')}`);
      }
    }
  }

  return changes;
}

/**
 * Validate tool arguments against tool schema.
 *
 * Note: this validates as true if it doesn't recognize the schema format,
 *       and validates as true if it doesn't cover the type of the input.
 *
 * @param schema - The tool's input schema.
 * @param args - The arguments to validate.
 *
 * @returns An object indicating whether the arguments are valid and any error message.
 */
export function validateToolArgs(
  schema: MCPToolState['inputSchema'] | null,
  args: Record<string, unknown>
): {
  /** Whether the recognized schema constraints accept the arguments. */
  valid: boolean;
  /** Validation failure message when the arguments are invalid. */
  error?: string;
} {
  if (!schema) {
    return { valid: true };
  }

  try {
    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredProp of schema.required) {
        if (args[requiredProp] === undefined || args[requiredProp] === null) {
          return {
            valid: false,
            error: `Required parameter '${requiredProp}' is missing`,
          };
        }
      }
    }

    if (schema.properties) {
      const properties = schema.properties as Record<string, unknown>;
      for (const [propName, propSchema] of Object.entries(properties)) {
        if (args[propName] !== undefined) {
          const propType =
            typeof propSchema === 'object' && propSchema !== null && 'type' in propSchema
              ? propSchema.type
              : undefined;
          const actualType = typeof args[propName];

          if (propType === 'string' && actualType !== 'string') {
            return {
              valid: false,
              error: `Parameter '${propName}' should be a string, got ${actualType}`,
            };
          }
          if (propType === 'number' && actualType !== 'number') {
            return {
              valid: false,
              error: `Parameter '${propName}' should be a number, got ${actualType}`,
            };
          }
          if (propType === 'boolean' && actualType !== 'boolean') {
            return {
              valid: false,
              error: `Parameter '${propName}' should be a boolean, got ${actualType}`,
            };
          }
          if (propType === 'array' && !Array.isArray(args[propName])) {
            return {
              valid: false,
              error: `Parameter '${propName}' should be an array, got ${actualType}`,
            };
          }
          if (
            propType === 'object' &&
            (actualType !== 'object' || Array.isArray(args[propName]) || args[propName] === null)
          ) {
            return {
              valid: false,
              error: `Parameter '${propName}' should be an object, got ${actualType}`,
            };
          }

          if (
            typeof propType === 'string' &&
            !['string', 'number', 'boolean', 'array', 'object'].includes(propType)
          ) {
            console.warn(`Unsupported parameter type in schema: ${propType}`);
          }
        }
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Create a summary of changes between two MCP tool configurations.
 *
 * @param currentConfig - The current MCP tools configuration.
 * @param newConfig - The new MCP tools configuration.
 *
 * @returns An object containing the total number of changes and a summary text.
 */
export function summarizeMcpToolStateChanges(
  currentConfig: Record<string, Record<string, MCPToolState>>,
  newConfig: Record<string, Record<string, MCPToolState>>
): {
  /** Total number of enabled, disabled, added, and removed tools. */
  totalChanges: number;
  /** Human-readable summary grouped by change category. */
  summaryText: string;
} {
  const enabledTools: string[] = [];
  const disabledTools: string[] = [];
  const addedTools: string[] = [];
  const removedTools: string[] = [];

  const allServers = new Set([
    ...Object.keys(currentConfig || {}),
    ...Object.keys(newConfig || {}),
  ]);

  for (const serverName of allServers) {
    const currentServerConfig = currentConfig[serverName] || {};
    const newServerConfig = newConfig[serverName] || {};

    const allTools = new Set([
      ...Object.keys(currentServerConfig),
      ...Object.keys(newServerConfig),
    ]);

    for (const toolName of allTools) {
      const currentTool = currentServerConfig[toolName];
      const newTool = newServerConfig[toolName];
      const displayName = `${toolName} (${serverName})`;

      if (!currentTool && newTool) {
        // Count a newly-added tool as a single change regardless of its enabled state.
        // The enabled/disabled state of a brand-new tool is not itself a change.
        addedTools.push(displayName);
      } else if (currentTool && !newTool) {
        removedTools.push(displayName);
      } else if (currentTool && newTool) {
        // Normalise using default-enabled semantics: `enabled !== false` so that
        // a missing field (legacy config) and an explicit `true` are treated
        // identically and don't produce phantom enable/disable summary entries.
        const wasEnabled = currentTool.enabled !== false;
        const isEnabled = newTool.enabled !== false;
        if (wasEnabled !== isEnabled) {
          if (isEnabled) {
            enabledTools.push(displayName);
          } else {
            disabledTools.push(displayName);
          }
        }
      }
    }
  }

  const summaryParts: string[] = [];

  if (enabledTools.length > 0) {
    summaryParts.push(`✓ ENABLE (${enabledTools.length}): ${enabledTools.join(', ')}`);
  }

  if (disabledTools.length > 0) {
    summaryParts.push(`✗ DISABLE (${disabledTools.length}): ${disabledTools.join(', ')}`);
  }

  if (addedTools.length > 0) {
    summaryParts.push(`+ ADD (${addedTools.length}): ${addedTools.join(', ')}`);
  }

  if (removedTools.length > 0) {
    summaryParts.push(`- REMOVE (${removedTools.length}): ${removedTools.join(', ')}`);
  }

  const totalChanges =
    enabledTools.length + disabledTools.length + addedTools.length + removedTools.length;

  return {
    totalChanges,
    summaryText: summaryParts.join('\n\n'),
  };
}
