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

import {
  createAksMcpServer,
  reconcileBuiltinServers,
} from '@headlamp-k8s/ai-common/mcp/config/builtinServers';
import type { MCPServer, MCPSettings } from '@headlamp-k8s/ai-common/mcp/types';
import { isAksDesktopHost } from '@headlamp-k8s/ai-ui/mcp/host';
import { pluginStore } from '../pluginState';

const EMPTY_MCP_CONFIG: MCPSettings = { enabled: false, servers: [] };

/** @returns Built-in MCP servers the current desktop host preconfigures. */
function getBuiltinServersForHost(): MCPServer[] {
  return isAksDesktopHost() ? [createAksMcpServer()] : [];
}

/**
 * Preconfigures host-provided MCP servers and keeps their definitions current.
 *
 * @returns Resolves once reconciliation has been attempted.
 */
export async function seedBuiltinMCPServers(): Promise<void> {
  const builtinServers = getBuiltinServersForHost();
  if (builtinServers.length === 0) return;

  const mcpApi = typeof window === 'undefined' ? undefined : window.desktopApi?.mcp;
  if (!mcpApi) return;

  try {
    const response = await mcpApi.getConfig();
    // Seeding against a fallback config would drop servers the read failed to return.
    if (!response?.success || !Array.isArray(response.config?.servers)) {
      console.error('Failed to read MCP configuration before seeding:', response?.error);
      return;
    }
    const currentConfig = { ...EMPTY_MCP_CONFIG, ...response.config } as MCPSettings;

    const previousState = pluginStore.get()?.seededBuiltinMCPServers;
    const result = reconcileBuiltinServers(currentConfig, builtinServers, previousState);
    if (!result.changed) {
      if (result.stateChanged) {
        pluginStore.update({ seededBuiltinMCPServers: result.state });
      }
      return;
    }

    const updateResponse = await mcpApi.updateConfig(result.config);
    if (!updateResponse?.success) {
      console.error('Failed to preconfigure built-in MCP servers:', updateResponse?.error);
      return;
    }

    pluginStore.update({
      mcpConfig: result.config,
      seededBuiltinMCPServers: result.state,
    });
  } catch (error) {
    console.error('Error preconfiguring built-in MCP servers:', error);
  }
}
